import { AuditChange } from './audit-event'

/**
 * Diff superficial entre dos juegos de primitives (spec 31): solo los campos cuyo
 * valor cambió, con antes y después. Suficiente porque los campos del schema son
 * planos; lo anidado (composición) queda fuera del historial a propósito.
 */
export function changesBetween(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, AuditChange> {
  const changes: Record<string, AuditChange> = {}

  for (const key of Object.keys(after)) {
    if (JSON.stringify(after[key]) !== JSON.stringify(before[key])) {
      changes[key] = { from: before[key], to: after[key] }
    }
  }

  return changes
}
