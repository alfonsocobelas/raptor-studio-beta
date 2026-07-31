import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { VehicleRepository } from '../../domain/vehicle-repository'
import { withVin } from '../../domain/specifications/vehicle-with-vin.specification'
import { withPlate } from '../../domain/specifications/vehicle-with-plate.specification'
import { VehicleId } from '../../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'
import { UpdateVehicleInput } from '../dtos/update-vehicle-input.dto'

@Injectable()
export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async invoke(input: UpdateVehicleInput): Promise<void> {
    const vehicleId = VehicleId.create(input.id)
    const vehicle = await this.vehicleRepository.get(vehicleId)

    if (!vehicle) {
      throw new EntityNotFoundError('Vehicle', input.id)
    }

    const newVin = vehicle.newVinIfChanged(input.updates)

    if (newVin) {
      const vinExists = await this.vehicleRepository.exists(withVin(newVin))

      if (vinExists) {
        throw new AlreadyExistsError('Vehicle', 'vin', newVin.value)
      }
    }

    const newPlate = vehicle.newPlateIfChanged(input.updates)

    if (newPlate) {
      const plateExists = await this.vehicleRepository.exists(withPlate(newPlate))

      if (plateExists) {
        throw new AlreadyExistsError('Vehicle', 'plate', newPlate.value)
      }
    }

    vehicle.updateDetails(input.updates)
    await this.vehicleRepository.save(vehicle)
  }
}
