import { Injectable } from '@nestjs/common'
import { InvalidRequestError } from '../../../../../shared/domain/errors'
import { AuthToken } from '../../domain/auth-token'
import { AuthTokenRepository } from '../../domain/auth-token-repository'
import { UserRepository } from '../../domain/user-repository'
import { AuthTokenHash } from '../../domain/value-objects/auth-token-hash.vo'
import { PasswordHash } from '../../domain/value-objects/password-hash.vo'
import { PlainPassword } from '../../domain/value-objects/plain-password.vo'
import { AcceptInvitationInput } from '../dtos/accept-invitation-input.dto'
import { Clock } from '../ports/clock'
import { PasswordHasher } from '../ports/password-hasher'
import { SecureTokenGenerator } from '../ports/secure-token-generator'

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly clock: Clock
  ) {}

  async invoke(input: AcceptInvitationInput): Promise<void> {
    const now = this.clock.now()
    const plain = PlainPassword.create(input.password)

    const authToken = await this.findUsableInvitation(input.token, now)
    const user = await this.userRepository.get(authToken.userId)
    if (!user) {
      throw new InvalidRequestError('Invalid or expired invitation token')
    }

    const passwordHash = PasswordHash.create(await this.passwordHasher.hash(plain.value))
    user.activateWithPassword(passwordHash)
    await this.userRepository.save(user)

    authToken.markUsed(now)
    await this.authTokenRepository.save(authToken)
  }

  private async findUsableInvitation(token: string, now: Date): Promise<AuthToken> {
    let hash: AuthTokenHash
    try {
      hash = AuthTokenHash.create(this.tokenGenerator.hash(token))
    } catch {
      throw new InvalidRequestError('Invalid or expired invitation token')
    }
    const authToken = await this.authTokenRepository.findByTokenHash(hash)
    if (!authToken || !authToken.type.isInvitation() || !authToken.isUsable(now)) {
      throw new InvalidRequestError('Invalid or expired invitation token')
    }
    return authToken
  }
}
