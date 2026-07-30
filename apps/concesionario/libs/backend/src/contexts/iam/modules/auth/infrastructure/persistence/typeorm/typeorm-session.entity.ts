import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'session', schema: 'iam' })
export class TypeOrmSessionEntity {
  @PrimaryColumn('uuid')
  id!: string

  @Column('uuid')
  userId!: string

  @Column('varchar', { length: 64 })
  tokenHash!: string

  @Column('timestamptz')
  createdAt!: Date

  @Column('timestamptz')
  expiresAt!: Date

  @Column('timestamptz')
  lastSeenAt!: Date
}
