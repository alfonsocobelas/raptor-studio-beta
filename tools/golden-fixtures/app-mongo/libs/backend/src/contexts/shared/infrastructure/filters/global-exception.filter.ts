/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Request, Response } from 'express'
import { BaseCustomError } from '../../domain/errors'
import { AppLogger } from '../../domain/logger/logger'
import { messageOf } from '../../utils/error-message'

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof HttpException) {
      return void response.status(exception.getStatus()).json(exception.getResponse())
    }

    if (exception instanceof BaseCustomError) {
      return void response.status(exception.getStatus()).json(exception.getResponse())
    }

    // Unexpected error: keep the HTTP response generic (never leak internals to the client),
    // but log it server-side so a 500 stops being a black box.
    const request = ctx.getRequest<Request>()
    const message = messageOf(exception)
    const stack = exception instanceof Error ? exception.stack : undefined
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}: ${message}`,
      stack,
      GlobalExceptionFilter.name
    )

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      name: 'InternalServerError',
      message: 'An unexpected error occurred'
    })
  }
}
