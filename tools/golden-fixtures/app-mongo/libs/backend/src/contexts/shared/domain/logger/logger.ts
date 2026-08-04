/* eslint-disable @typescript-eslint/no-explicit-any */

// Domain port for logging. Infrastructure provides the concrete adapter (winston + Azure/OTel).
// Kept `any` on purpose: a logger must accept arbitrary messages/metadata shapes.
export abstract class AppLogger {
  abstract log(message: any, context?: string): void
  abstract error(message: any, trace?: string, context?: string): void
  abstract warn(message: any, context?: string): void
  abstract debug(message: any, context?: string): void
}
