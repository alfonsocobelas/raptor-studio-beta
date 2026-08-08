import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { CUSTOMER_CONSTRAINTS as LIMITS } from '../../../domain/customer-constants'

@Entity({ name: 'customers', schema: 'sap_licensing' })
export class TypeOrmCustomerEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.SAP_ID.MAX })
  sapId!: string

  @Column('varchar', { length: LIMITS.NAME.MAX })
  name!: string

  @Column('varchar', { length: LIMITS.TAX_ID.MAX, default: '' })
  taxId!: string

  @Column('varchar', { length: LIMITS.INDUSTRY.MAX, default: '' })
  industry!: string

  @Column('varchar', { length: LIMITS.ADDRESS.MAX, default: '' })
  address!: string

  @Column('varchar', { length: LIMITS.PHONE.MAX, default: '' })
  phone!: string

  @Column('varchar', { length: LIMITS.NOTES.MAX, default: '' })
  notes!: string

  @Column('varchar', { length: LIMITS.CITY.MAX, default: '' })
  city!: string

  @Column('varchar', { length: LIMITS.COUNTRY.MAX, default: '' })
  country!: string

  @Column('varchar', { length: 10 })
  customerType!: string

  @Column('varchar', { length: 20, default: 'active' })
  status!: string

  @Column('timestamptz', { nullable: true })
  archivedAt!: Nullable<Date>

  @Column('timestamptz', { nullable: true })
  lastSeenInSyncAt!: Nullable<Date>

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
