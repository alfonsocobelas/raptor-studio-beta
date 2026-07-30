import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm'
import { ConsumptionSourceValue } from '../../../domain/consumption-source'

@Entity({ name: 'consumption_records', schema: 'sap_licensing' })
export class TypeOrmConsumptionRecordEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('uuid')
  licenseId!: string

  @Column('int')
  periodYear!: number

  @Column('int')
  periodMonth!: number

  @Column('int')
  units!: number

  // El borde HTTP valida contra ConsumptionSource.VALUES y el dominio escribe la unión tipada,
  // así que la columna puede declararse con el tipo estrecho sin cast en el mapper.
  @Column('varchar', { length: 20, default: 'MANUAL' })
  source!: ConsumptionSourceValue

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date
}
