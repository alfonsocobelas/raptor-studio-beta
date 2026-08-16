import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { CLIENTE_CONSTRAINTS as LIMITS } from '../../../domain/cliente-constants'

@Entity({ name: 'clientes', schema: 'aguas' })
export class TypeOrmClienteEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.NOMBRE.MAX })
  nombre!: string

  @Column('varchar', { length: 40 })
  tipo!: string

  @Column('varchar', { length: LIMITS.TELEFONO.MAX, default: '' })
  telefono!: string

  @Column('varchar', { length: LIMITS.LOCALIDAD.MAX, default: '' })
  localidad!: string

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
