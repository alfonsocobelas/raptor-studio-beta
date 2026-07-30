/* eslint-disable @typescript-eslint/no-explicit-any */

// Stable port for logging (ADR-004 catalog). Adapters: observability-azure (winston +
// Azure Monitor/OTel), future prometheus/sentry. Kept `any` on purpose: a logger must
// accept arbitrary messages/metadata shapes.
export abstract class AppLogger {
  abstract log(message: any, context?: string): void
  abstract error(message: any, trace?: string, context?: string): void
  abstract warn(message: any, context?: string): void
  abstract debug(message: any, context?: string): void
}

export const LOG_LEVEL_PRIORITY: Record<string, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  all: 5
}

export const enum LogLevel {
  SILENT = 'silent',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  ALL = 'all'
}
