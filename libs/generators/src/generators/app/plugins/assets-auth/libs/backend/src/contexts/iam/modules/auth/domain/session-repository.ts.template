import { Nullable } from '../../../../shared/domain/types'
import { UserId } from '../../../../shared/domain/value-objects/iam/user-id.vo'
import { Session } from './session'
import { SessionTokenHash } from './value-objects/session-token-hash.vo'

export abstract class SessionRepository {
  abstract findByTokenHash(tokenHash: SessionTokenHash): Promise<Nullable<Session>>
  abstract register(session: Session): Promise<void>
  abstract save(session: Session): Promise<void>
  abstract deleteByTokenHash(tokenHash: SessionTokenHash): Promise<void>
  abstract deleteAllByUserId(userId: UserId): Promise<void>
}
