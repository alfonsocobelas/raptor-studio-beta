import { Column, Entity, Index, PrimaryColumn } from 'typeorm'
import { AuditChange } from '../../domain/audit/audit-event'

@Entity({ name: 'audit_events', schema: 'shared' })
@Index('idx_audit_events_entity', ['entity', 'entityId', 'occurredAt'])
export class TypeOrmAuditEventEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: 100 })
  entity!: string

  @Column('uuid')
  entityId!: string

  @Column('varchar', { length: 20 })
  action!: string

  @Column('jsonb', { default: () => "'{}'" })
  changes!: Record<string, AuditChange>

  @Column('timestamptz')
  occurredAt!: Date

  @Column('varchar', { length: 255, nullable: true })
  actor!: string | null
}
