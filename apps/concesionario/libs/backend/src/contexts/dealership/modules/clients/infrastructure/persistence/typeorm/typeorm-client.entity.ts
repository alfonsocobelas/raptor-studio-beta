import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { CLIENT_CONSTRAINTS as LIMITS } from '../../../domain/client-constants'

@Entity({ name: 'clients', schema: 'dealership' })
export class TypeOrmClientEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.NAME.MAX })
  name!: string

  @Column('varchar', { length: 20, default: 'individual' })
  clientType!: string

  @Column('varchar', { length: LIMITS.TAX_ID.MAX, default: '' })
  taxId!: string

  @Column('varchar', { length: LIMITS.EMAIL.MAX, default: '' })
  email!: string

  @Column('varchar', { length: LIMITS.PHONE.MAX, default: '' })
  phone!: string

  @Column('varchar', { length: LIMITS.CITY.MAX, default: '' })
  city!: string

  @Column('varchar', { length: LIMITS.ADDRESS.MAX, default: '' })
  address!: string

  @Column('varchar', { length: LIMITS.NOTES.MAX, default: '' })
  notes!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
