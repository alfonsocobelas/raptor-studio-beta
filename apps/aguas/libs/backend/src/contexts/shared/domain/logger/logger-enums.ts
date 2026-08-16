export const LOG_LEVEL_COLORS: Record<string, string> = {
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[34m',
  reset: '\x1b[0m'
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
