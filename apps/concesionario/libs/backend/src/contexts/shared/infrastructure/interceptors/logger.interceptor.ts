/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { AppLogger } from '../../domain/logger/logger'

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest()
    const response = ctx.getResponse()

    const { method, originalUrl, query, body } = request
    const startTime = Date.now()

    return next.handle().pipe(
      tap({
        next: responseData => {
          const duration = Date.now() - startTime

          this.logger.log(
            {
              message: `HTTP ${method} ${originalUrl} - Success`,
              type: 'REPORT',
              duration,
              http: { method, url: originalUrl, statusCode: response.statusCode },
              request: { queryParams: query, body },
              response: responseData
            },
            'LoggerInterceptor'
          )
        },
        error: err => {
          const duration = Date.now() - startTime

          this.logger.error(
            {
              message: `HTTP ${method} ${originalUrl} - Failed`,
              type: 'REPORT',
              duration,
              http: { method, url: originalUrl },
              request: { queryParams: query, body }
            },
            err.stack,
            'LoggerInterceptor'
          )
        }
      })
    )
  }
}
