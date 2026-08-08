import { Injectable, Logger } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { AuditAction, AuditEvent } from '../../domain/audit/audit-event'
import { AuditTrailPort } from '../../domain/audit/audit-trail.port'
import { TypeOrmTransactionManager } from '../persistence/typeorm/typeorm-transaction-manager'
import { TypeOrmAuditEventEntity } from './typeorm-audit-event.entity'

@Injectable()
export class TypeOrmAuditTrail extends AuditTrailPort {
  private readonly logger = new Logger('AuditTrail')

  constructor(private readonly transactionManager: TypeOrmTransactionManager) {
    super()
  }

  async record(event: Omit<AuditEvent, 'id' | 'occurredAt'>): Promise<void> {
    try {
      // create+save y no insert(): QueryDeepPartialEntity no admite el Record del jsonb
      const row = this.repository().create({ ...event, id: uuidv7(), occurredAt: new Date() })
      await this.repository().save(row)
    } catch (error) {
      // mejor esfuerzo: perder un evento no puede tumbar la operación de negocio
      this.logger.warn(`audit event lost for ${event.entity} ${event.entityId}: ${String(error)}`)
    }
  }

  async of(entity: string, entityId: string, limit: number): Promise<AuditEvent[]> {
    const rows = await this.repository().find({
      where: { entity, entityId },
      order: { occurredAt: 'DESC' },
      take: limit
    })

    return rows.map(row => ({
      id: row.id,
      entity: row.entity,
      entityId: row.entityId,
      action: row.action as AuditAction,
      changes: row.changes,
      occurredAt: row.occurredAt.toISOString(),
      actor: row.actor
    }))
  }

  private repository() {
    return this.transactionManager.getEntityManager().getRepository(TypeOrmAuditEventEntity)
  }
}
