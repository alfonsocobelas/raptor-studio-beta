import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { AGENTE_CONSTRAINTS as LIMITS } from '../../../domain/agente-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'agentes', schema: 'fincaraiz' })
export class TypeOrmAgenteEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.NOMBRE.MAX })
  nombre!: string

  @Column('varchar', { length: LIMITS.EMAIL.MAX, default: '' })
  email!: string

  @Column('varchar', { length: LIMITS.TELEFONO.MAX, default: '' })
  telefono!: string

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  comisionPorcentaje!: number

  @Column('boolean', { default: false })
  activo!: boolean

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
