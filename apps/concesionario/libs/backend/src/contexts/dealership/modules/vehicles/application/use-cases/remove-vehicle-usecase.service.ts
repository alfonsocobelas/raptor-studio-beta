import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { VehicleId } from '../../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'
import { VehicleRepository } from '../../domain/vehicle-repository'
import { RemoveVehicleInput } from '../dtos/remove-vehicle-input.dto'

@Injectable()
export class RemoveVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async invoke(input: RemoveVehicleInput): Promise<void> {
    const vehicleId = VehicleId.create(input.id)
    const vehicle = await this.vehicleRepository.get(vehicleId)

    if (!vehicle) {
      throw new EntityNotFoundError('Vehicle', input.id)
    }

    await this.vehicleRepository.remove(vehicleId)
  }
}
