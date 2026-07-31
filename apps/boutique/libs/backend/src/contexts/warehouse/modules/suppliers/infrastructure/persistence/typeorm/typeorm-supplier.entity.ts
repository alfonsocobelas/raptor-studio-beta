import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { SUPPLIER_CONSTRAINTS as LIMITS } from '../../../domain/supplier-constants'

@Entity({ name: 'suppliers', schema: 'warehouse' })
export class TypeOrmSupplierEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.NAME.MAX })
  name!: string

  @Column('varchar', { length: LIMITS.TAX_ID.MAX, default: '' })
  taxId!: string

  @Column('varchar', { length: LIMITS.EMAIL.MAX, default: '' })
  email!: string

  @Column('varchar', { length: LIMITS.PHONE.MAX, default: '' })
  phone!: string

  @Column('varchar', { length: LIMITS.CITY.MAX, default: '' })
  city!: string

  @Column('int', { default: 0 })
  leadTimeDays!: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
