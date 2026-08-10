import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { PROJECT_CONSTRAINTS as LIMITS } from '../../../domain/project-constants'

@Entity({ name: 'projects', schema: 'sap_licensing' })
export class TypeOrmProjectEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('uuid')
  customerId!: string

  @Column('varchar', { length: 200 })
  customerName!: string

  @Column('varchar', { length: LIMITS.NAME.MAX })
  name!: string

  @Column('varchar', { length: LIMITS.DESCRIPTION.MAX, default: '' })
  description!: string

  @Column('date', { nullable: true })
  startDate!: Nullable<string>

  @Column('date', { nullable: true })
  endDate!: Nullable<string>

  @Column('varchar', { length: 20, default: 'planning' })
  status!: string

  @Column('varchar', { length: 20, default: 'AVVALE' })
  implementer!: string

  // Origen y lifecycle sync (spec 46): origin distingue ME_SAP (gobernados por el sync) de MANUAL;
  // lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia en el feed.
  @Column('varchar', { length: 20, default: 'MANUAL' })
  origin!: string

  @Column('varchar', { length: 20, default: 'active' })
  lifecycleStatus!: string

  @Column('timestamptz', { nullable: true })
  archivedAt!: Nullable<Date>

  @Column('timestamptz', { nullable: true })
  lastSeenInSyncAt!: Nullable<Date>

  // Campos SAP (spec 46): identidad de upsert + crudo del feed, sin invariante propia.
  @Column('varchar', { length: LIMITS.SAP_PROJECT_ID.MAX, nullable: true })
  sapProjectId!: Nullable<string>

  @Column('varchar', { length: 50, nullable: true })
  atRisk!: Nullable<string>

  @Column('varchar', { length: 50, nullable: true })
  inEscalation!: Nullable<string>

  @Column('int', { nullable: true })
  nbrOfWaves!: Nullable<number>

  @Column('varchar', { length: 50, nullable: true })
  waveStage!: Nullable<string>

  @Column('varchar', { length: 50, nullable: true })
  waveStatus!: Nullable<string>

  @Column('date', { nullable: true })
  planToGoLive!: Nullable<string>

  // --- AUDIT FIELDS --- //
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date

  // Operación que archivó esta fila: restaurar devuelve exactamente lo que ella arrastró
  @Column('uuid', { name: 'deleted_op', nullable: true })
  deletedOp?: string
}
