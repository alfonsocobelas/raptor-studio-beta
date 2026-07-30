import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { AuthTokenId } from '../../../../shared/domain/value-objects/iam/auth-token-id.vo'
import { UserId } from '../../../../shared/domain/value-objects/iam/user-id.vo'
import { AuthTokenError } from './auth-errors'
import { AuthTokenPrimitiveProps } from './auth-types'
import { AuthTokenHash } from './value-objects/auth-token-hash.vo'
import { AuthTokenType } from './value-objects/auth-token-type.vo'

export interface AuthTokenIssueProps {
  id: AuthTokenId
  userId: UserId
  tokenHash: AuthTokenHash
  type: AuthTokenType
}

export class AuthToken extends AggregateRoot {
  private constructor(
    private readonly _id: AuthTokenId,
    private readonly _userId: UserId,
    private readonly _tokenHash: AuthTokenHash,
    private readonly _type: AuthTokenType,
    private readonly _createdAt: Date,
    private readonly _expiresAt: Date,
    private _usedAt: Nullable<Date>
  ) {
    super()
  }

  get id(): AuthTokenId {
    return this._id
  }
  get userId(): UserId {
    return this._userId
  }
  get tokenHash(): AuthTokenHash {
    return this._tokenHash
  }
  get type(): AuthTokenType {
    return this._type
  }

  static issue(props: AuthTokenIssueProps, now: Date, expiryHours: number): AuthToken {
    const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60_000)
    return new AuthToken(props.id, props.userId, props.tokenHash, props.type, now, expiresAt, null)
  }

  static fromPrimitives(props: AuthTokenPrimitiveProps): AuthToken {
    return new AuthToken(
      AuthTokenId.create(props.id),
      UserId.create(props.userId),
      AuthTokenHash.create(props.tokenHash),
      AuthTokenType.create(props.type),
      new Date(props.createdAt),
      new Date(props.expiresAt),
      props.usedAt ? new Date(props.usedAt) : null
    )
  }

  toPrimitives(): AuthTokenPrimitiveProps {
    return {
      id: this._id.value,
      userId: this._userId.value,
      tokenHash: this._tokenHash.value,
      type: this._type.value as AuthTokenPrimitiveProps['type'],
      createdAt: this._createdAt,
      expiresAt: this._expiresAt,
      usedAt: this._usedAt
    }
  }

  isUsable(now: Date): boolean {
    return this._usedAt === null && this._expiresAt.getTime() > now.getTime()
  }

  markUsed(now: Date): void {
    if (this._usedAt !== null) {
      throw new AuthTokenError('Auth token has already been used')
    }
    this._usedAt = now
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof AuthToken)) {
      return false
    }
    return this._id.equals(other._id)
  }
}
