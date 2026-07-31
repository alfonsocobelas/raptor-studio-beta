import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { MovementRepository } from '../../domain/movement-repository'
import { withReference } from '../../domain/specifications/movement-with-reference.specification'
import { MovementId } from '../../../../../shared/domain/value-objects/movements/movement-id.vo'
import { UpdateMovementInput } from '../dtos/update-movement-input.dto'

@Injectable()
export class UpdateMovementUseCase {
  constructor(private readonly movementRepository: MovementRepository) {}

  async invoke(input: UpdateMovementInput): Promise<void> {
    const movementId = MovementId.create(input.id)
    const movement = await this.movementRepository.get(movementId)

    if (!movement) {
      throw new EntityNotFoundError('Movement', input.id)
    }

    const newReference = movement.newReferenceIfChanged(input.updates)

    if (newReference) {
      const referenceExists = await this.movementRepository.exists(withReference(newReference))

      if (referenceExists) {
        throw new AlreadyExistsError('Movement', 'reference', newReference.value)
      }
    }

    movement.updateDetails(input.updates)
    await this.movementRepository.save(movement)
  }
}
