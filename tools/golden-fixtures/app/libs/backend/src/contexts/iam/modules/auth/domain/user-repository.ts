import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { UserId } from '../../../../shared/domain/value-objects/iam/user-id.vo'
import { Email } from './value-objects/email.vo'
import { User } from './user'

export abstract class UserRepository {
  abstract get(id: UserId): Promise<Nullable<User>>
  abstract findByEmail(email: Email): Promise<Nullable<User>>
  abstract register(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract matching(criteria: Criteria): Promise<User[]>
  abstract count(criteria: Criteria): Promise<number>
  abstract countActiveAdmins(): Promise<number>
}
