export interface AuditChangeDto {
  from: unknown
  to: unknown
}

/** Un evento del historial (spec 31), tal y como lo sirve GET /:id/history. */
export interface AuditEventDto {
  id: string
  entity: string
  entityId: string
  action: 'created' | 'updated' | 'deleted' | 'restored'
  changes: Record<string, AuditChangeDto>
  occurredAt: string
  actor: string | null
}
