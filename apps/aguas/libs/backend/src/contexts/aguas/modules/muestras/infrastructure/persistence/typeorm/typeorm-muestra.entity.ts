import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { MUESTRA_CONSTRAINTS as LIMITS } from '../../../domain/muestra-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'muestras', schema: 'aguas' })
export class TypeOrmMuestraEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.CODIGO.MAX })
  codigo!: string

  @Column('varchar', { length: 40 })
  estado!: string

  @Column('varchar', { length: LIMITS.TECNICO.MAX, default: '' })
  tecnico!: string

  @Column('date')
  recogida!: string

  @Column('date')
  limiteInforme!: string

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  importe!: number

  @Column('uuid')
  puntoId!: string

  @Column('varchar', { length: LIMITS.PUNTO_NAME.MAX })
  puntoName!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null

  // Operación que archivó esta fila: restaurar devuelve exactamente lo que ella arrastró
  @Column('uuid', { name: 'deleted_op', nullable: true })
  deletedOp?: string | null
}
