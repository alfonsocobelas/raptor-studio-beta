import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { UnauthorizedError } from '../../../../../shared/domain/errors'
import { SessionId } from '../../../../../shared/domain/value-objects/iam/session-id.vo'
import { UserId } from '../../../../../shared/domain/value-objects/iam/user-id.vo'
import { AUTH_POLICY } from '../../domain/auth-constants'
import { Session } from '../../domain/session'
import { SessionRepository } from '../../domain/session-repository'
import { UserRepository } from '../../domain/user-repository'
import { PasswordHash } from '../../domain/value-objects/password-hash.vo'
import { PlainPassword } from '../../domain/value-objects/plain-password.vo'
import { SessionTokenHash } from '../../domain/value-objects/session-token-hash.vo'
import { ChangePasswordInput } from '../dtos/change-password-input.dto'
import { Clock } from '../ports/clock'
import { PasswordHasher } from '../ports/password-hasher'
import { SecureTokenGenerator } from '../ports/secure-token-generator'

export interface ChangePasswordResult {
  sessionToken: string
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly clock: Clock
  ) {}

  async invoke(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    const now = this.clock.now()
    const plain = PlainPassword.create(input.newPassword)

    const user = await this.userRepository.get(UserId.create(input.userId))
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials')
    }
    if (user.isLocked(now)) {
      throw new UnauthorizedError('Account temporarily locked')
    }

    const passwordMatches = await this.passwordHasher.verify(user.passwordHash.value, input.currentPassword)
    if (!passwordMatches) {
      user.registerFailedLogin(now, AUTH_POLICY.LOGIN_MAX_FAILED_ATTEMPTS, AUTH_POLICY.LOGIN_LOCK_MINUTES)
      await this.userRepository.save(user)
      throw new UnauthorizedError('Invalid credentials')
    }

    user.clearFailedLogins()
    user.changePassword(PasswordHash.create(await this.passwordHasher.hash(plain.value)))
    await this.userRepository.save(user)

    // Order matters: delete every session first, then issue the replacement one
    await this.sessionRepository.deleteAllByUserId(user.id)
    const token = this.tokenGenerator.generate()
    const session = Session.issue(
      {
        id: SessionId.create(uuidv7()),
        userId: user.id,
        tokenHash: SessionTokenHash.create(token.hash)
      },
      now,
      AUTH_POLICY.SESSION_IDLE_HOURS
    )
    await this.sessionRepository.register(session)

    return { sessionToken: token.value }
  }
}
