export type AuditAction = 'created' | 'updated' | 'deleted' | 'restored'

export interface AuditChange {
  from: unknown
  to: unknown
}

/** Un hecho consumado sobre un registro: qué pasó, qué cambió y cuándo (spec 31). */
export interface AuditEvent {
  id: string
  /** Nombre del recurso ('project') */
  entity: string
  entityId: string
  action: AuditAction
  /** update: { campo: { from, to } }; created/deleted/restored: {} */
  changes: Record<string, AuditChange>
  occurredAt: string
  /** Lo rellenará la ranura auth; null mientras tanto */
  actor: string | null
}
