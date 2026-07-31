import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { UnauthorizedError } from '../../../../../shared/domain/errors'
import { SessionId } from '../../../../../shared/domain/value-objects/iam/session-id.vo'
import { AUTH_POLICY } from '../../domain/auth-constants'
import { Session } from '../../domain/session'
import { SessionRepository } from '../../domain/session-repository'
import { UserRepository } from '../../domain/user-repository'
import { Email } from '../../domain/value-objects/email.vo'
import { SessionTokenHash } from '../../domain/value-objects/session-token-hash.vo'
import { AuthenticatedUser, toAuthenticatedUser } from '../dtos/authenticated-user'
import { LoginInput } from '../dtos/login-input.dto'
import { Clock } from '../ports/clock'
import { PasswordHasher } from '../ports/password-hasher'
import { SecureTokenGenerator } from '../ports/secure-token-generator'

export interface LoginResult {
  sessionToken: string
  user: AuthenticatedUser
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly clock: Clock
  ) {}

  async invoke(input: LoginInput): Promise<LoginResult> {
    const now = this.clock.now()
    const email = this.parseEmail(input.email)

    const user = await this.userRepository.findByEmail(email)
    if (!user || user.status.isDisabled()) {
      throw new UnauthorizedError('Invalid credentials')
    }
    if (user.isLocked(now)) {
      throw new UnauthorizedError('Account temporarily locked')
    }
    if (!user.canLogin(now)) {
      throw new UnauthorizedError('Invalid credentials')
    }

    // canLogin guarantees a non-null password hash
    const passwordMatches = await this.passwordHasher.verify(user.passwordHash!.value, input.password)
    if (!passwordMatches) {
      user.registerFailedLogin(now, AUTH_POLICY.LOGIN_MAX_FAILED_ATTEMPTS, AUTH_POLICY.LOGIN_LOCK_MINUTES)
      await this.userRepository.save(user)
      throw new UnauthorizedError('Invalid credentials')
    }

    user.clearFailedLogins()
    await this.userRepository.save(user)

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

    return { sessionToken: token.value, user: toAuthenticatedUser(user) }
  }

  private parseEmail(value: string): Email {
    try {
      return Email.create(value)
    } catch {
      throw new UnauthorizedError('Invalid credentials')
    }
  }
}
