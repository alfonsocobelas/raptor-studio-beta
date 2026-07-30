import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { AuthTokenId } from '../../../../../shared/domain/value-objects/iam/auth-token-id.vo'
import { UserId } from '../../../../../shared/domain/value-objects/iam/user-id.vo'
import { AUTH_POLICY } from '../../domain/auth-constants'
import { AuthToken } from '../../domain/auth-token'
import { AuthTokenRepository } from '../../domain/auth-token-repository'
import { User } from '../../domain/user'
import { UserRepository } from '../../domain/user-repository'
import { AuthTokenHash } from '../../domain/value-objects/auth-token-hash.vo'
import { AuthTokenType } from '../../domain/value-objects/auth-token-type.vo'
import { Email } from '../../domain/value-objects/email.vo'
import { UserName } from '../../domain/value-objects/user-name.vo'
import { UserRole } from '../../domain/value-objects/user-role.vo'
import { InviteUserInput } from '../dtos/invite-user-input.dto'
import { AuthConfig } from '../ports/auth-config'
import { Clock } from '../ports/clock'
import { EmailSender } from '../ports/email-sender'
import { SecureTokenGenerator } from '../ports/secure-token-generator'

@Injectable()
export class InviteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly emailSender: EmailSender,
    private readonly clock: Clock,
    private readonly authConfig: AuthConfig
  ) {}

  async invoke(input: InviteUserInput): Promise<void> {
    const now = this.clock.now()
    const email = Email.create(input.email)

    const existing = await this.userRepository.findByEmail(email)
    const user = existing ? this.ensureInvitable(existing, email) : await this.createPending(email, input)

    const invitationType = AuthTokenType.create('invitation')
    await this.authTokenRepository.supersedeUnused(user.id, invitationType)

    const token = this.tokenGenerator.generate()
    const authToken = AuthToken.issue(
      {
        id: AuthTokenId.create(uuidv7()),
        userId: user.id,
        tokenHash: AuthTokenHash.create(token.hash),
        type: invitationType
      },
      now,
      AUTH_POLICY.INVITATION_EXPIRY_HOURS
    )
    await this.authTokenRepository.register(authToken)

    const link = `${this.authConfig.appBaseUrl}/accept-invitation?token=${encodeURIComponent(token.value)}`
    await this.emailSender.sendInvitation(email.value, link)
  }

  private ensureInvitable(existing: User, email: Email): User {
    if (!existing.status.isPending()) {
      throw new AlreadyExistsError('User', 'email', email.value)
    }
    return existing
  }

  private async createPending(email: Email, input: InviteUserInput): Promise<User> {
    const user = User.invite({
      id: UserId.create(uuidv7()),
      email,
      name: UserName.create(input.name),
      role: UserRole.create(input.role)
    })
    await this.userRepository.register(user)
    return user
  }
}
