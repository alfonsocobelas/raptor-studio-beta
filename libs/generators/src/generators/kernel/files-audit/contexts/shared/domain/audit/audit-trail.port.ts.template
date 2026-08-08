import { AuditEvent } from './audit-event'

/**
 * Memoria de cambios de la app. `record` es MEJOR ESFUERZO: el adapter traga el
 * fallo (con log) porque perder un evento nunca puede tumbar la operación de negocio.
 */
export abstract class AuditTrailPort {
  abstract record(event: Omit<AuditEvent, 'id' | 'occurredAt'>): Promise<void>
  abstract of(entity: string, entityId: string, limit: number): Promise<AuditEvent[]>
}
