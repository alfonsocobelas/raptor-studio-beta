import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { GarmentId } from '../../../../../shared/domain/value-objects/garments/garment-id.vo'
import { GarmentRepository } from '../../domain/garment-repository'
import { RemoveGarmentInput } from '../dtos/remove-garment-input.dto'

@Injectable()
export class RemoveGarmentUseCase {
  constructor(private readonly garmentRepository: GarmentRepository) {}

  async invoke(input: RemoveGarmentInput): Promise<void> {
    const garmentId = GarmentId.create(input.id)
    const garment = await this.garmentRepository.get(garmentId)

    if (!garment) {
      throw new EntityNotFoundError('Garment', input.id)
    }

    await this.garmentRepository.remove(garmentId)
  }
}
