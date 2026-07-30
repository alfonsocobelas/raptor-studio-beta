import { Column, Entity, PrimaryColumn } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'

@Entity({ name: 'auth_token', schema: 'iam' })
export class TypeOrmAuthTokenEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('uuid')
  userId!: string

  @Column('varchar', { length: 64 })
  tokenHash!: string

  @Column('varchar', { length: 20 })
  type!: string

  @Column('timestamptz')
  expiresAt!: Date

  @Column('timestamptz', { nullable: true })
  usedAt!: Nullable<Date>

  @Column('timestamptz')
  createdAt!: Date
}
