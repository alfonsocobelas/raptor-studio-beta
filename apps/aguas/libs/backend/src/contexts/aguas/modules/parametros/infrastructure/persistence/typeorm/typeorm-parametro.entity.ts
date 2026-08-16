import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { PARAMETRO_CONSTRAINTS as LIMITS } from '../../../domain/parametro-constants'

const numericTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value)
}

@Entity({ name: 'parametros', schema: 'aguas' })
export class TypeOrmParametroEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.CODIGO.MAX })
  codigo!: string

  @Column('varchar', { length: LIMITS.NOMBRE.MAX, default: '' })
  nombre!: string

  @Column('varchar', { length: LIMITS.METODO.MAX, default: '' })
  metodo!: string

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  limiteLegal!: number

  @Column('numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer })
  precio!: number

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
