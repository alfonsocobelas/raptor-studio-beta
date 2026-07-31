import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { VEHICLE_CONSTRAINTS as LIMITS } from '../../../domain/vehicle-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'vehicles', schema: 'dealership' })
export class TypeOrmVehicleEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.VIN.MAX })
  vin!: string

  @Column('varchar', { length: LIMITS.BRAND.MAX })
  brand!: string

  @Column('varchar', { length: LIMITS.MODEL.MAX })
  model!: string

  @Column('varchar', { length: LIMITS.VERSION.MAX, default: '' })
  version!: string

  @Column('varchar', { length: LIMITS.PLATE.MAX, default: '' })
  plate!: string

  @Column('varchar', { length: LIMITS.COLOR.MAX, default: '' })
  color!: string

  @Column('varchar', { length: 20 })
  fuel!: string

  @Column('int')
  year!: number

  @Column('int', { default: 0 })
  mileage!: number

  @Column('numeric', { precision: 12, scale: 2, default: 0, transformer: numericTransformer })
  price!: number

  @Column('varchar', { length: 20, default: 'stock' })
  status!: string

  @Column('varchar', { length: LIMITS.NOTES.MAX, default: '' })
  notes!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
