import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm'
import { CUSTOMER_CONSTRAINTS as LIMITS } from '../../../domain/customer-constants'

@Entity({ name: 'contacts', schema: 'sap_licensing' })
export class TypeOrmContactEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('uuid')
  customerId!: string

  @Column('varchar', { length: LIMITS.CONTACT.NAME.MAX })
  name!: string

  @Column('varchar', { length: LIMITS.CONTACT.ROLE.MAX, default: '' })
  role!: string

  @Column('varchar', { length: LIMITS.CONTACT.EMAIL.MAX, default: '' })
  email!: string

  @Column('varchar', { length: LIMITS.PHONE.MAX, default: '' })
  phone!: string

  @Column('boolean', { default: false })
  isPrimary!: boolean

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date
}
