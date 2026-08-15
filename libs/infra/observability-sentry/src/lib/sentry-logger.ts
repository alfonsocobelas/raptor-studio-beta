/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppLogger, LoggerSanitizer } from '@raptor/infra-ports'

/** Structural contract over the Sentry SDK so tests inject a fake (@sentry/node satisfies it). */
export interface SentryLike {
  captureException(
    error: unknown,
    context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
  ): unknown
  captureMessage(message: string, level?: 'warning' | 'error' | 'info' | 'debug'): unknown
}

/**
 * Sentry adapter for the AppLogger port: error tracking with free tier, complementary to
 * AzureLogger/Prometheus. Typical composition: a fan-out logger sends everything to the
 * primary logger and errors/warns also here. Messages pass the shared LoggerSanitizer.
 */
export class SentryLogger extends AppLogger {
  constructor(private readonly sentry: SentryLike) {
    super()
  }

  log(message: any, context?: string): void {
    this.sentry.captureMessage(this.body(message, context), 'info')
  }

  error(message: any, trace?: string, context?: string): void {
    if (message instanceof Error) {
      this.sentry.captureException(message, { tags: { ...(context && { context }) } })
      return
    }
    this.sentry.captureException(new Error(this.body(message, context)), {
      ...(trace && { extra: { stackTrace: trace } })
    })
  }

  warn(message: any, context?: string): void {
    this.sentry.captureMessage(this.body(message, context), 'warning')
  }

  debug(message: any, context?: string): void {
    this.sentry.captureMessage(this.body(message, context), 'debug')
  }

  private body(message: any, context?: string): string {
    const sanitized = LoggerSanitizer.sanitize(message)
    const text = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized)
    return context ? `[${context}] ${text}` : text
  }
}
