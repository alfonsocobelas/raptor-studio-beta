import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { PUNTO_CONSTRAINTS as LIMITS } from '../../../domain/punto-constants'

@Entity({ name: 'puntos', schema: 'aguas' })
export class TypeOrmPuntoEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.NOMBRE.MAX })
  nombre!: string

  @Column('varchar', { length: 40 })
  tipoAgua!: string

  @Column('varchar', { length: LIMITS.DIRECCION.MAX, default: '' })
  direccion!: string

  @Column('varchar', { length: LIMITS.COORDENADAS.MAX, default: '' })
  coordenadas!: string

  @Column('boolean', { default: false })
  obligatorio!: boolean

  @Column('uuid')
  clienteId!: string

  @Column('varchar', { length: LIMITS.CLIENTE_NAME.MAX })
  clienteName!: string

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
