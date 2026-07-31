import { Injectable } from '@nestjs/common'
import { SessionRepository } from '../../domain/session-repository'
import { SessionTokenHash } from '../../domain/value-objects/session-token-hash.vo'
import { SecureTokenGenerator } from '../ports/secure-token-generator'
import { LogoutInput } from '../dtos/logout-input.dto'

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenGenerator: SecureTokenGenerator
  ) {}

  async invoke(input: LogoutInput): Promise<void> {
    let tokenHash: SessionTokenHash
    try {
      tokenHash = SessionTokenHash.create(this.tokenGenerator.hash(input.sessionToken))
    } catch {
      return
    }
    await this.sessionRepository.deleteByTokenHash(tokenHash)
  }
}
