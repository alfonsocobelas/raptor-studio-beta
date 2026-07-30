/* eslint-disable @typescript-eslint/no-explicit-any */
import * as winston from 'winston'
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport'
import { AppLogger, LOG_LEVEL_PRIORITY, LogLevel, LoggerSanitizer } from '@acc/infra/ports'

// Deployed environments ship to Azure Monitor (see telemetry/init-telemetry.ts) and get
// machine-parseable JSON + the OpenTelemetry transport. Everywhere else (local/test/qa)
// logs stay human-readable in stdout and skip OTel (there is no LoggerProvider there).
const DEPLOYED_ENVS = ['dev', 'prod']

export interface AzureLoggerOptions {
  /** Runtime environment name; 'dev'/'prod' switch to JSON + OTel transport */
  env: string
  /** Minimum level ('silent'|'error'|'warn'|'info'|'debug'|'all'); defaults to 'all' */
  level?: string
}

/**
 * Winston + Azure Monitor logger adapter (extracted from sap-licenses). Framework-free:
 * a Nest app aliases it to both AppLogger and Nest's Logger in its composition root
 * (`useExisting`), exactly as the reference logger.module.ts does.
 */
export class AzureLogger extends AppLogger {
  private readonly winstonLogger: winston.Logger
  private readonly options: AzureLoggerOptions

  constructor(options: AzureLoggerOptions) {
    super()
    this.options = options

    const activeLevel = this.getActiveLogLevel()
    const transports: winston.transport[] = []

    if (DEPLOYED_ENVS.includes(options.env)) {
      transports.push(new winston.transports.Console({ format: winston.format.json() }), new OpenTelemetryTransportV3())
    } else {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, context }) => {
              const ctxLabel = context ? ` [${context}]` : ''
              return `[App] ${process.pid} - ${timestamp} ${level}${ctxLabel} ${message}`
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

    const currentPriority = LOG_LEVEL_PRIORITY[level] ?? LOG_LEVEL_PRIORITY['silent']
    const configuredPriority = LOG_LEVEL_PRIORITY[configLevel] ?? LOG_LEVEL_PRIORITY['silent']

    if (currentPriority > configuredPriority) {
      return
    }

    const sanitizedMessage = LoggerSanitizer.sanitize(message)
    const logBody = this.buildHumanReadableBody(sanitizedMessage)

    this.winstonLogger.log({
      level,
      message: logBody,
      context,
      environment: this.options.env,
      ...(trace && { stackTrace: trace }),
      ...(typeof sanitizedMessage === 'object' && sanitizedMessage !== null ? { metadata: sanitizedMessage } : {})
    })
  }

  private getActiveLogLevel(): string {
    return (this.options.level ?? LogLevel.ALL).toLowerCase()
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
