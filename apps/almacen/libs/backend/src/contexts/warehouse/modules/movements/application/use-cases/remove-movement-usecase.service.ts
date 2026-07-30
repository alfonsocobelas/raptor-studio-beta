import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { MovementId } from '../../../../../shared/domain/value-objects/movements/movement-id.vo'
import { MovementRepository } from '../../domain/movement-repository'
import { RemoveMovementInput } from '../dtos/remove-movement-input.dto'

@Injectable()
export class RemoveMovementUseCase {
  constructor(private readonly movementRepository: MovementRepository) {}

  async invoke(input: RemoveMovementInput): Promise<void> {
    const movementId = MovementId.create(input.id)
    const movement = await this.movementRepository.get(movementId)

    if (!movement) {
      throw new EntityNotFoundError('Movement', input.id)
    }

    await this.movementRepository.remove(movementId)
  }
}
