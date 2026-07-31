import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Movement } from '../../domain/movement'
import { MovementRepository } from '../../domain/movement-repository'
import { withReference } from '../../domain/specifications/movement-with-reference.specification'
import { RegisterMovementInput } from '../dtos/register-movement-input.dto'

@Injectable()
export class RegisterMovementUseCase {
  constructor(private readonly movementRepository: MovementRepository) {}

  async invoke(input: RegisterMovementInput): Promise<void> {
    const movement = Movement.register(input)
    const referenceExists = await this.movementRepository.exists(withReference(movement.reference))

    if (referenceExists) {
      throw new AlreadyExistsError('Movement', 'reference', movement.reference.value)
    }

    await this.movementRepository.register(movement)
  }
}
