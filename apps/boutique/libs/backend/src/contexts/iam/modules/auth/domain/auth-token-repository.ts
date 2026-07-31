import { Nullable } from '../../../../shared/domain/types'
import { UserId } from '../../../../shared/domain/value-objects/iam/user-id.vo'
import { AuthToken } from './auth-token'
import { AuthTokenHash } from './value-objects/auth-token-hash.vo'
import { AuthTokenType } from './value-objects/auth-token-type.vo'

export abstract class AuthTokenRepository {
  abstract findByTokenHash(tokenHash: AuthTokenHash): Promise<Nullable<AuthToken>>
  abstract register(token: AuthToken): Promise<void>
  abstract save(token: AuthToken): Promise<void>
  abstract supersedeUnused(userId: UserId, type: AuthTokenType): Promise<void>
}
