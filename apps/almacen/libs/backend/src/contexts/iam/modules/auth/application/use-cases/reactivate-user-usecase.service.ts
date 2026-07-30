import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { UserId } from '../../../../../shared/domain/value-objects/iam/user-id.vo'
import { UserRepository } from '../../domain/user-repository'
import { ReactivateUserInput } from '../dtos/reactivate-user-input.dto'

@Injectable()
export class ReactivateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async invoke(input: ReactivateUserInput): Promise<void> {
    const user = await this.userRepository.get(UserId.create(input.targetUserId))
    if (!user) {
      throw new EntityNotFoundError('User', input.targetUserId)
    }

    user.reactivate()
    await this.userRepository.save(user)
  }
}
