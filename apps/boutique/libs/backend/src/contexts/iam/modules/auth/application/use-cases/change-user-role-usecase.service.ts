import { Injectable } from '@nestjs/common'
import { EntityNotFoundError, ForbiddenError } from '../../../../../shared/domain/errors'
import { UserId } from '../../../../../shared/domain/value-objects/iam/user-id.vo'
import { UserError } from '../../domain/auth-errors'
import { UserRepository } from '../../domain/user-repository'
import { UserRole } from '../../domain/value-objects/user-role.vo'
import { ChangeUserRoleInput } from '../dtos/change-user-role-input.dto'

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async invoke(input: ChangeUserRoleInput): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new ForbiddenError('You cannot change your own role')
    }

    const user = await this.userRepository.get(UserId.create(input.targetUserId))
    if (!user) {
      throw new EntityNotFoundError('User', input.targetUserId)
    }

    const newRole = UserRole.create(input.role)
    const isDemotingActiveAdmin = user.status.isActive() && user.role.isAdmin() && !newRole.isAdmin()
    if (isDemotingActiveAdmin && (await this.userRepository.countActiveAdmins()) <= 1) {
      throw new UserError('Cannot demote the last active admin')
    }

    user.changeRole(newRole)
    await this.userRepository.save(user)
  }
}
