import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { AUTH_CONSTRAINTS as LIMITS } from '../../../domain/auth-constants'

@Entity({ name: 'user', schema: 'iam' })
export class TypeOrmUserEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('varchar', { length: LIMITS.EMAIL.MAX })
  email!: string

  @Column('varchar', { length: LIMITS.NAME.MAX })
  name!: string

  @Column('varchar', { nullable: true })
  passwordHash!: Nullable<string>

  @Column('varchar', { length: 20 })
  role!: string

  @Column('varchar', { length: 20 })
  status!: string

  @Column('int', { default: 0 })
  failedLoginAttempts!: number

  @Column('timestamptz', { nullable: true })
  lockedUntil!: Nullable<Date>

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
