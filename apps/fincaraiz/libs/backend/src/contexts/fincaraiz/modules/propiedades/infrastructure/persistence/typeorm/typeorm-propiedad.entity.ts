import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { PROPIEDAD_CONSTRAINTS as LIMITS } from '../../../domain/propiedad-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'propiedades', schema: 'fincaraiz' })
export class TypeOrmPropiedadEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.TITULO.MAX })
  titulo!: string

  @Column('varchar', { length: LIMITS.ZONA.MAX, default: '' })
  zona!: string

  @Column('varchar', { length: 40 })
  estado!: string

  @Column('int', { default: 0 })
  metrosCuadrados!: number

  @Column('int', { default: 0 })
  habitaciones!: number

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  precio!: number

  @Column('date')
  fechaAlta!: string

  @Column('boolean', { default: false })
  exclusiva!: boolean

  @Column('uuid')
  agenteId!: string

  @Column('varchar', { length: LIMITS.AGENTE_NAME.MAX })
  agenteName!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
