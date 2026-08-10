import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { LICENSE_CONSTRAINTS as LIMITS } from '../../../domain/license-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'licenses', schema: 'sap_licensing' })
export class TypeOrmLicenseEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('uuid')
  contractId!: string

  @Column('uuid')
  customerId!: string

  @Column('varchar', { length: LIMITS.CUSTOMER_NAME.MAX })
  customerName!: string

  @Column('varchar', { length: LIMITS.CONTRACT_NUMBER.MAX })
  contractNumber!: string

  @Column('date', { nullable: true })
  contractEndDate!: Nullable<string>

  @Column('varchar', { length: LIMITS.METRIC_ID.MAX, default: '' })
  metricId!: string

  @Column('varchar', { length: LIMITS.METRIC_NAME.MAX })
  metricName!: string

  @Column('varchar', { length: LIMITS.SUB_SOLUTION_AREA_NAME.MAX, default: '' })
  subSolutionAreaName!: string

  @Column('varchar', { length: 20 })
  metric!: string

  @Column('int')
  licensedUnits!: number

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  pricePerUnit!: number

  @Column('varchar', { length: 20, default: 'active' })
  status!: string

  // Origen y lifecycle SAP (spec 33): source distingue ME_SAP (gobernadas por el sync) de MANUAL;
  // lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia del material.
  @Column('varchar', { length: 20, default: 'MANUAL' })
  source!: string

  @Column('varchar', { length: 40, default: '' })
  materialId!: string

  @Column('varchar', { length: 20, default: 'active' })
  lifecycleStatus!: string

  @Column('timestamptz', { nullable: true })
  archivedAt!: Nullable<Date>

  @Column('timestamptz', { nullable: true })
  lastSeenInSyncAt!: Nullable<Date>

  // Snapshot de consumo denormalizado (spec 26): lo recalcula recomputeConsumptionSnapshot en cada
  // escritura de consumos; nunca se escribe desde el dominio.
  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  currentUnits!: number

  @Column('numeric', { precision: 8, scale: 2, default: 0, transformer: numericTransformer })
  consumptionPct!: number

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  excessUnits!: number

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  annualValue!: number

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
