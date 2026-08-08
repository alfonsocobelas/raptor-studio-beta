import { AuditChange } from './audit-event'

/**
 * Diff superficial entre dos juegos de primitives (spec 31): solo los campos cuyo
 * valor cambió, con antes y después. Suficiente porque los campos del schema son
 * planos; lo anidado (composición) queda fuera del historial a propósito.
 */
export function changesBetween(before: object, after: object): Record<string, AuditChange> {
  // los primitives llegan como interfaces sin index signature: se leen como registro
  const prev = before as Record<string, unknown>
  const next = after as Record<string, unknown>
  const changes: Record<string, AuditChange> = {}

  for (const key of Object.keys(next)) {
    if (JSON.stringify(next[key]) !== JSON.stringify(prev[key])) {
      changes[key] = { from: prev[key], to: next[key] }
    }
  }

  return changes
}
