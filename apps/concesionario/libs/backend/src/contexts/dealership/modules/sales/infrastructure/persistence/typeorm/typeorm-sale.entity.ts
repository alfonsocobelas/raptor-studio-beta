import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { SALE_CONSTRAINTS as LIMITS } from '../../../domain/sale-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'sales', schema: 'dealership' })
export class TypeOrmSaleEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.REFERENCE.MAX })
  reference!: string

  @Column('date')
  saleDate!: string

  @Column('varchar', { length: LIMITS.VEHICLE_LABEL.MAX })
  vehicleLabel!: string

  @Column('varchar', { length: LIMITS.CLIENT_LABEL.MAX })
  clientLabel!: string

  @Column('varchar', { length: LIMITS.SALESPERSON.MAX, default: '' })
  salesperson!: string

  @Column('numeric', { precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  amount!: number

  @Column('numeric', { precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  discount!: number

  @Column('varchar', { length: 20, default: 'cash' })
  paymentMethod!: string

  @Column('varchar', { length: 20, default: 'pending' })
  status!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
