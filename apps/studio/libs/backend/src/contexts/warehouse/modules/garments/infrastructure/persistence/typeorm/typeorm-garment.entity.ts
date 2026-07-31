import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { GARMENT_CONSTRAINTS as LIMITS } from '../../../domain/garment-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'garments', schema: 'warehouse' })
export class TypeOrmGarmentEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.SKU.MAX })
  sku!: string

  @Column('varchar', { length: LIMITS.NAME.MAX })
  name!: string

  @Column('varchar', { length: 20 })
  category!: string

  @Column('varchar', { length: 10 })
  size!: string

  @Column('varchar', { length: LIMITS.BRAND.MAX, default: '' })
  brand!: string

  @Column('varchar', { length: LIMITS.COLOR.MAX, default: '' })
  color!: string

  @Column('numeric', { precision: 10, scale: 2, default: 0, transformer: numericTransformer })
  price!: number

  @Column('int', { default: 0 })
  stock!: number

  @Column('varchar', { length: 20, default: 'active' })
  status!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
