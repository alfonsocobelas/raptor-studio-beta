import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { VehicleId } from '../../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'
import { VehicleRepository } from '../../domain/vehicle-repository'
import { VehiclePrimitiveProps } from '../../domain/vehicle-types'
import { GetVehicleInput } from '../dtos/get-vehicle-input.dto'

@Injectable()
export class GetVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async invoke(input: GetVehicleInput): Promise<VehiclePrimitiveProps> {
    const vehicleId = VehicleId.create(input.id)
    const vehicle = await this.vehicleRepository.get(vehicleId)

    if (!vehicle) {
      throw new EntityNotFoundError('Vehicle', input.id)
    }

    return vehicle.toPrimitives()
  }
}
