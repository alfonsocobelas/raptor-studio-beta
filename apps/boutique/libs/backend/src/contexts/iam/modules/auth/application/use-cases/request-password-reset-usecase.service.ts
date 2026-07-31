import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { AuthTokenId } from '../../../../../shared/domain/value-objects/iam/auth-token-id.vo'
import { AUTH_POLICY } from '../../domain/auth-constants'
import { AuthToken } from '../../domain/auth-token'
import { AuthTokenRepository } from '../../domain/auth-token-repository'
import { UserRepository } from '../../domain/user-repository'
import { AuthTokenHash } from '../../domain/value-objects/auth-token-hash.vo'
import { AuthTokenType } from '../../domain/value-objects/auth-token-type.vo'
import { Email } from '../../domain/value-objects/email.vo'
import { ForgotPasswordInput } from '../dtos/forgot-password-input.dto'
import { AuthConfig } from '../ports/auth-config'
import { Clock } from '../ports/clock'
import { EmailSender } from '../ports/email-sender'
import { SecureTokenGenerator } from '../ports/secure-token-generator'

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly emailSender: EmailSender,
    private readonly clock: Clock,
    private readonly authConfig: AuthConfig
  ) {}

  async invoke(input: ForgotPasswordInput): Promise<void> {
    const now = this.clock.now()

    let email: Email
    try {
      email = Email.create(input.email)
    } catch {
      return
    }

    const user = await this.userRepository.findByEmail(email)
    if (!user || !user.status.isActive()) {
      return
    }

    const resetType = AuthTokenType.create('password_reset')
    await this.authTokenRepository.supersedeUnused(user.id, resetType)

    const token = this.tokenGenerator.generate()
    const authToken = AuthToken.issue(
      {
        id: AuthTokenId.create(uuidv7()),
        userId: user.id,
        tokenHash: AuthTokenHash.create(token.hash),
        type: resetType
      },
      now,
      AUTH_POLICY.PASSWORD_RESET_EXPIRY_HOURS
    )
    await this.authTokenRepository.register(authToken)

    const link = `${this.authConfig.appBaseUrl}/reset-password?token=${encodeURIComponent(token.value)}`
    await this.emailSender.sendPasswordReset(email.value, link)
  }
}
