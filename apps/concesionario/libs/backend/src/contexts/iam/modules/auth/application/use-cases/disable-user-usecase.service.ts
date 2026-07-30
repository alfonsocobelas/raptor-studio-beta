import { Injectable } from '@nestjs/common'
import { EntityNotFoundError, ForbiddenError } from '../../../../../shared/domain/errors'
import { UserId } from '../../../../../shared/domain/value-objects/iam/user-id.vo'
import { UserError } from '../../domain/auth-errors'
import { SessionRepository } from '../../domain/session-repository'
import { UserRepository } from '../../domain/user-repository'
import { DisableUserInput } from '../dtos/disable-user-input.dto'

@Injectable()
export class DisableUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async invoke(input: DisableUserInput): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new ForbiddenError('You cannot disable your own account')
    }

    const userId = UserId.create(input.targetUserId)
    const user = await this.userRepository.get(userId)
    if (!user) {
      throw new EntityNotFoundError('User', input.targetUserId)
    }

    const isActiveAdmin = user.status.isActive() && user.role.isAdmin()
    if (isActiveAdmin && (await this.userRepository.countActiveAdmins()) <= 1) {
      throw new UserError('Cannot disable the last active admin')
    }

    user.disable()
    await this.userRepository.save(user)
    await this.sessionRepository.deleteAllByUserId(userId)
  }
}
