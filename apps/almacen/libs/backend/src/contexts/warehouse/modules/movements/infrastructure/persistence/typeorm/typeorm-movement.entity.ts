import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { MOVEMENT_CONSTRAINTS as LIMITS } from '../../../domain/movement-constants'

@Entity({ name: 'movements', schema: 'warehouse' })
export class TypeOrmMovementEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.REFERENCE.MAX })
  reference!: string

  @Column('date')
  movementDate!: string

  @Column('varchar', { length: 10 })
  movementType!: string

  @Column('varchar', { length: LIMITS.GARMENT_LABEL.MAX })
  garmentLabel!: string

  @Column('int')
  quantity!: number

  @Column('varchar', { length: LIMITS.COUNTERPARTY.MAX, default: '' })
  counterparty!: string

  @Column('varchar', { length: 20 })
  reason!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
