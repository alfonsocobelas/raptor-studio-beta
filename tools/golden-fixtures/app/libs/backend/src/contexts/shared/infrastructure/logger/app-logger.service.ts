/* eslint-disable @typescript-eslint/no-explicit-any */
import * as winston from 'winston'
import { ConfigService } from '@nestjs/config'
import { Inject, Injectable, LoggerService, Optional } from '@nestjs/common'
import { AppLogger } from '../../domain/logger/logger'
import { LoggerSanitizer } from '../../domain/logger/logger-sanitizer'
import { LOG_LEVEL_PRIORITY, LogLevel } from '../../domain/logger/logger-enums'

// Los entornos desplegados emiten JSON parseable por máquina; el resto (local/test/qa),
// texto legible en stdout.
const DEPLOYED_ENVS = ['dev', 'prod']

/**
 * Costura de extensión: un proveedor de infraestructura puede añadir transportes de winston
 * (p. ej. el de OpenTelemetry con Azure Monitor) sin tocar este fichero. Sin proveedor, la
 * app registra en stdout y nada más — no arrastra el SDK de ninguna nube.
 */
export const EXTRA_LOG_TRANSPORTS = 'EXTRA_LOG_TRANSPORTS'

@Injectable()
export class AppLoggerService extends AppLogger implements LoggerService {
  private readonly winstonLogger: winston.Logger

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(EXTRA_LOG_TRANSPORTS) extraTransports: winston.transport[] = []
  ) {
    super()

    const env = this.configService.get<string>('env') ?? 'prod'
    const activeLevel = this.getActiveLogLevel()
    const transports: winston.transport[] = []

    if (DEPLOYED_ENVS.includes(env)) {
      transports.push(new winston.transports.Console({ format: winston.format.json() }))
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
      transports: [...transports, ...extraTransports]
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
