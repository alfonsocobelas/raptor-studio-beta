import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../shared/domain/types'
import { AUTH_POLICY } from '../../domain/auth-constants'
import { SessionRepository } from '../../domain/session-repository'
import { UserRepository } from '../../domain/user-repository'
import { SessionTokenHash } from '../../domain/value-objects/session-token-hash.vo'
import { AuthenticatedUser, toAuthenticatedUser } from '../dtos/authenticated-user'
import { Clock } from '../ports/clock'
import { SecureTokenGenerator } from '../ports/secure-token-generator'
import { ResolveSessionInput } from '../dtos/resolve-session-input.dto'

@Injectable()
export class ResolveSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly clock: Clock
  ) {}

  async invoke(input: ResolveSessionInput): Promise<Nullable<AuthenticatedUser>> {
    const now = this.clock.now()

    let tokenHash: SessionTokenHash
    try {
      tokenHash = SessionTokenHash.create(this.tokenGenerator.hash(input.sessionToken))
    } catch {
      return null
    }

    const session = await this.sessionRepository.findByTokenHash(tokenHash)
    if (!session) {
      return null
    }
    if (session.isExpired(now)) {
      await this.sessionRepository.deleteByTokenHash(tokenHash)
      return null
    }

    const user = await this.userRepository.get(session.userId)
    if (!user || !user.status.isActive()) {
      return null
    }

    session.slide(now, AUTH_POLICY.SESSION_IDLE_HOURS, AUTH_POLICY.SESSION_ABSOLUTE_MAX_DAYS)
    await this.sessionRepository.save(session)

    return toAuthenticatedUser(user)
  }
}
