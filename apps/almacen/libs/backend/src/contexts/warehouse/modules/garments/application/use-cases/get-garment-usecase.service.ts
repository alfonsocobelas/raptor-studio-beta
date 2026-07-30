import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { GarmentId } from '../../../../../shared/domain/value-objects/garments/garment-id.vo'
import { GarmentRepository } from '../../domain/garment-repository'
import { GarmentPrimitiveProps } from '../../domain/garment-types'
import { GetGarmentInput } from '../dtos/get-garment-input.dto'

@Injectable()
export class GetGarmentUseCase {
  constructor(private readonly garmentRepository: GarmentRepository) {}

  async invoke(input: GetGarmentInput): Promise<GarmentPrimitiveProps> {
    const garmentId = GarmentId.create(input.id)
    const garment = await this.garmentRepository.get(garmentId)

    if (!garment) {
      throw new EntityNotFoundError('Garment', input.id)
    }

    return garment.toPrimitives()
  }
}
