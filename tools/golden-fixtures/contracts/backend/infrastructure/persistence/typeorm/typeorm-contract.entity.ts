import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { CONTRACT_CONSTRAINTS as LIMITS } from '../../../domain/contract-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

// Variante null-safe para columnas NUMERIC nullable: Number(null) sería 0 (dato corrupto silencioso)
const nullableNumericTransformer = {
  to: (value: Nullable<number>): Nullable<number> => value,
  from: (value: Nullable<string>): Nullable<number> => (value === null ? null : Number(value))
}

@Entity({ name: 'contracts', schema: 'sap_licensing' })
export class TypeOrmContractEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: 20 })
  contractType!: string

  // nullable a nivel de tipo desde spec 44 (maintenance: 36% de ISMaintenances sin ContractID);
  // la columna física sigue NOT NULL hasta que la migración de la spec 44 la altere.
  @Column('varchar', { length: LIMITS.CONTRACT_NUMBER.MAX, nullable: true })
  contractNumber!: Nullable<string>

  @Column('uuid')
  customerId!: string

  @Column('varchar', { length: LIMITS.CUSTOMER_NAME.MAX })
  customerName!: string

  @Column('varchar', { length: LIMITS.CMS_CASE_ID.MAX, default: '' })
  cmsCaseId!: string

  @Column('varchar', { length: LIMITS.BUSINESS_MODEL.MAX, default: '' })
  businessModel!: string

  @Column('text', { array: true, default: () => "'{}'" })
  subSolutionAreas!: string[]

  @Column('int', { default: 1 })
  nbrOfContracts!: number

  @Column('boolean', { default: false })
  isFavorite!: boolean

  @Column('varchar', { length: 20, default: 'active' })
  status!: string

  @Column('varchar', { length: 20, default: 'AVVALE_SOLD' })
  source!: string

  @Column('date', { nullable: true })
  startDate!: Nullable<string>

  @Column('date', { nullable: true })
  endDate!: Nullable<string>

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  totalValue!: number

  @Column('varchar', { length: LIMITS.CURRENCY.LENGTH, default: 'EUR' })
  currency!: string

  @Column('varchar', { length: 20, default: 'yearly' })
  billingFrequency!: string

  @Column('varchar', { length: 20, default: 'manual' })
  renewalType!: string

  @Column('varchar', { length: LIMITS.NOTES.MAX, default: '' })
  notes!: string

  // Origen y lifecycle sync (spec 44): origin distingue ME_SAP (gobernados por el sync) de MANUAL;
  // lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia en los feeds.
  @Column('varchar', { length: 20, default: 'MANUAL' })
  origin!: string

  @Column('varchar', { length: 20, default: 'active' })
  lifecycleStatus!: string

  @Column('timestamptz', { nullable: true })
  archivedAt!: Nullable<Date>

  @Column('timestamptz', { nullable: true })
  lastSeenInSyncAt!: Nullable<Date>

  // Campos maintenance (spec 44), solo poblados por el sync de ISMaintenances
  @Column('varchar', { length: LIMITS.SUPPORT_MODEL.MAX, default: '' })
  supportModel!: string

  @Column('date', { nullable: true })
  upcomingMaintenanceEnd!: Nullable<string>

  @Column('numeric', { precision: 15, scale: 2, nullable: true, transformer: nullableNumericTransformer })
  upcomingMaintenanceFee!: Nullable<number>

  // --- AUDIT FIELDS --- //
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date
}
