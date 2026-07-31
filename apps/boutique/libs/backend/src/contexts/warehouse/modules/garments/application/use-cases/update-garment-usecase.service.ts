import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { GarmentRepository } from '../../domain/garment-repository'
import { withSku } from '../../domain/specifications/garment-with-sku.specification'
import { GarmentId } from '../../../../../shared/domain/value-objects/garments/garment-id.vo'
import { UpdateGarmentInput } from '../dtos/update-garment-input.dto'

@Injectable()
export class UpdateGarmentUseCase {
  constructor(private readonly garmentRepository: GarmentRepository) {}

  async invoke(input: UpdateGarmentInput): Promise<void> {
    const garmentId = GarmentId.create(input.id)
    const garment = await this.garmentRepository.get(garmentId)

    if (!garment) {
      throw new EntityNotFoundError('Garment', input.id)
    }

    const newSku = garment.newSkuIfChanged(input.updates)

    if (newSku) {
      const skuExists = await this.garmentRepository.exists(withSku(newSku))

      if (skuExists) {
        throw new AlreadyExistsError('Garment', 'sku', newSku.value)
      }
    }

    garment.updateDetails(input.updates)
    await this.garmentRepository.save(garment)
  }
}
