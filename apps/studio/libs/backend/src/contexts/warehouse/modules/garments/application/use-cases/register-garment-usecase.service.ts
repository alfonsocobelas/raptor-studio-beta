import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Garment } from '../../domain/garment'
import { GarmentRepository } from '../../domain/garment-repository'
import { withSku } from '../../domain/specifications/garment-with-sku.specification'
import { RegisterGarmentInput } from '../dtos/register-garment-input.dto'

@Injectable()
export class RegisterGarmentUseCase {
  constructor(private readonly garmentRepository: GarmentRepository) {}

  async invoke(input: RegisterGarmentInput): Promise<void> {
    const garment = Garment.register(input)
    const skuExists = await this.garmentRepository.exists(withSku(garment.sku))

    if (skuExists) {
      throw new AlreadyExistsError('Garment', 'sku', garment.sku.value)
    }

    await this.garmentRepository.register(garment)
  }
}
