import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { VISITA_CONSTRAINTS as LIMITS } from '../../../domain/visita-constants'

@Entity({ name: 'visitas', schema: 'fincaraiz' })
export class TypeOrmVisitaEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.REFERENCIA.MAX })
  referencia!: string

  @Column('date')
  fecha!: string

  @Column('varchar', { length: LIMITS.INTERESADO.MAX, default: '' })
  interesado!: string

  @Column('varchar', { length: LIMITS.OBSERVACIONES.MAX, default: '' })
  observaciones!: string

  @Column('boolean', { default: false })
  confirmada!: boolean

  @Column('uuid')
  propiedadId!: string

  @Column('varchar', { length: LIMITS.PROPIEDAD_NAME.MAX })
  propiedadName!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
