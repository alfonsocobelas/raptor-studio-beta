import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { MovementId } from '../../../../../shared/domain/value-objects/movements/movement-id.vo'
import { MovementRepository } from '../../domain/movement-repository'
import { MovementPrimitiveProps } from '../../domain/movement-types'
import { GetMovementInput } from '../dtos/get-movement-input.dto'

@Injectable()
export class GetMovementUseCase {
  constructor(private readonly movementRepository: MovementRepository) {}

  async invoke(input: GetMovementInput): Promise<MovementPrimitiveProps> {
    const movementId = MovementId.create(input.id)
    const movement = await this.movementRepository.get(movementId)

    if (!movement) {
      throw new EntityNotFoundError('Movement', input.id)
    }

    return movement.toPrimitives()
  }
}
