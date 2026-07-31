import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { SessionId } from '../../../../shared/domain/value-objects/iam/session-id.vo'
import { UserId } from '../../../../shared/domain/value-objects/iam/user-id.vo'
import { SessionPrimitiveProps } from './auth-types'
import { SessionTokenHash } from './value-objects/session-token-hash.vo'

export interface SessionIssueProps {
  id: SessionId
  userId: UserId
  tokenHash: SessionTokenHash
}

export class Session extends AggregateRoot {
  private constructor(
    private readonly _id: SessionId,
    private readonly _userId: UserId,
    private readonly _tokenHash: SessionTokenHash,
    private readonly _createdAt: Date,
    private _expiresAt: Date,
    private _lastSeenAt: Date
  ) {
    super()
  }

  get id(): SessionId {
    return this._id
  }
  get userId(): UserId {
    return this._userId
  }
  get tokenHash(): SessionTokenHash {
    return this._tokenHash
  }

  static issue(props: SessionIssueProps, now: Date, idleHours: number): Session {
    const expiresAt = new Date(now.getTime() + idleHours * 60 * 60_000)
    return new Session(props.id, props.userId, props.tokenHash, now, expiresAt, now)
  }

  static fromPrimitives(props: SessionPrimitiveProps): Session {
    return new Session(
      SessionId.create(props.id),
      UserId.create(props.userId),
      SessionTokenHash.create(props.tokenHash),
      new Date(props.createdAt),
      new Date(props.expiresAt),
      new Date(props.lastSeenAt)
    )
  }

  toPrimitives(): SessionPrimitiveProps {
    return {
      id: this._id.value,
      userId: this._userId.value,
      tokenHash: this._tokenHash.value,
      createdAt: this._createdAt,
      expiresAt: this._expiresAt,
      lastSeenAt: this._lastSeenAt
    }
  }

  isExpired(now: Date): boolean {
    return this._expiresAt.getTime() <= now.getTime()
  }

  slide(now: Date, idleHours: number, absoluteMaxDays: number): void {
    const idleExpiry = now.getTime() + idleHours * 60 * 60_000
    const absoluteCap = this._createdAt.getTime() + absoluteMaxDays * 24 * 60 * 60_000
    this._expiresAt = new Date(Math.min(idleExpiry, absoluteCap))
    this._lastSeenAt = now
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Session)) {
      return false
    }
    return this._id.equals(other._id)
  }
}
