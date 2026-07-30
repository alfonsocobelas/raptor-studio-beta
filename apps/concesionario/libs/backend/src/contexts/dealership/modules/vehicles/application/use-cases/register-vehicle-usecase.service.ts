import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Vehicle } from '../../domain/vehicle'
import { VehicleRepository } from '../../domain/vehicle-repository'
import { withVin } from '../../domain/specifications/vehicle-with-vin.specification'
import { withPlate } from '../../domain/specifications/vehicle-with-plate.specification'
import { RegisterVehicleInput } from '../dtos/register-vehicle-input.dto'

@Injectable()
export class RegisterVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async invoke(input: RegisterVehicleInput): Promise<void> {
    const vehicle = Vehicle.register(input)
    const vinExists = await this.vehicleRepository.exists(withVin(vehicle.vin))

    if (vinExists) {
      throw new AlreadyExistsError('Vehicle', 'vin', vehicle.vin.value)
    }

    const plateExists = await this.vehicleRepository.exists(withPlate(vehicle.plate))

    if (plateExists) {
      throw new AlreadyExistsError('Vehicle', 'plate', vehicle.plate.value)
    }

    await this.vehicleRepository.register(vehicle)
  }
}
