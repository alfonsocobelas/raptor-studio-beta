/* eslint-disable @typescript-eslint/no-explicit-any */
import * as winston from 'winston'
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport'
import { ConfigService } from '@nestjs/config'
import { Injectable, LoggerService } from '@nestjs/common'
import { AppLogger } from '../../../domain/logger/logger'
import { LoggerSanitizer } from '../../../domain/logger/logger-sanitizer'
import { LOG_LEVEL_PRIORITY, LogLevel } from '../../../domain/logger/logger-enums'

// Deployed environments ship to Azure Monitor (see telemetry/init-telemetry.ts) and get
// machine-parseable JSON + the OpenTelemetry transport. Everywhere else (local/test/qa)
// logs stay human-readable in stdout and skip OTel (there is no LoggerProvider there).
const DEPLOYED_ENVS = ['dev', 'prod']

@Injectable()
export class AzureLoggerService extends AppLogger implements LoggerService {
  private readonly winstonLogger: winston.Logger

  constructor(private readonly configService: ConfigService) {
    super()

    const env = this.configService.get<string>('env') ?? 'prod'
    const activeLevel = this.getActiveLogLevel()
    const transports: winston.transport[] = []

    if (DEPLOYED_ENVS.includes(env)) {
      transports.push(new winston.transports.Console({ format: winston.format.json() }), new OpenTelemetryTransportV3())
    } else {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, context }) => {
              const ctxLabel = context ? ` [${context}]` : ''
              return `[Nest] ${process.pid} - ${timestamp} ${level}${ctxLabel} ${message}`
            })
          )
        })
      )
    }

    this.winstonLogger = winston.createLogger({
      level: activeLevel === LogLevel.ALL ? 'debug' : activeLevel,
      transports
    })
  }

  log(message: any, context?: string): void {
    this.emit(LogLevel.INFO, message, context)
  }

  error(message: any, trace?: string, context?: string): void {
    this.emit(LogLevel.ERROR, message, context, trace)
  }

  warn(message: any, context?: string): void {
    this.emit(LogLevel.WARN, message, context)
  }

  debug(message: any, context?: string): void {
    this.emit(LogLevel.DEBUG, message, context)
  }

  private emit(level: LogLevel, message: any, context = 'App', trace?: string): void {
    const configLevel = this.getActiveLogLevel()

    if (configLevel === LogLevel.SILENT) {
      return
    }

    const currentPriority = LOG_LEVEL_PRIORITY[level] ?? LOG_LEVEL_PRIORITY.silent
    const configuredPriority = LOG_LEVEL_PRIORITY[configLevel] ?? LOG_LEVEL_PRIORITY.silent

    if (currentPriority > configuredPriority) {
      return
    }

    const env = this.configService.get<string>('env') ?? 'prod'
    const sanitizedMessage = LoggerSanitizer.sanitize(message)
    const logBody = this.buildHumanReadableBody(sanitizedMessage)

    this.winstonLogger.log({
      level,
      message: logBody,
      context,
      environment: env,
      ...(trace && { stackTrace: trace }),
      ...(typeof sanitizedMessage === 'object' && sanitizedMessage !== null ? { metadata: sanitizedMessage } : {})
    })
  }

  private getActiveLogLevel(): string {
    const level = this.configService.get<string>('logger.level') ?? LogLevel.ALL
    return level.toLowerCase()
  }

  private buildHumanReadableBody(sanitizedMessage: any = 'Structured Log'): string {
    if (typeof sanitizedMessage === 'string') {
      return sanitizedMessage
    }

    if (typeof sanitizedMessage === 'object' && sanitizedMessage !== null) {
      if (typeof sanitizedMessage.message === 'string') {
        return sanitizedMessage.message
      }

      if (sanitizedMessage.http && sanitizedMessage.http?.method) {
        return `HTTP ${sanitizedMessage.http.method} ${sanitizedMessage.http.url} - Status: ${sanitizedMessage.http.statusCode}`
      }
    }

    try {
      return JSON.stringify(sanitizedMessage)
    } catch {
      return String(sanitizedMessage)
    }
  }
}
