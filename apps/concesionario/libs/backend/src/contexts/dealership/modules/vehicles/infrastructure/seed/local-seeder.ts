import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterVehicleInput } from '../../application/dtos/register-vehicle-input.dto'
import { RegisterVehicleUseCase } from '../../application/use-cases/register-vehicle-usecase.service'

export interface VehicleSeedSummary {
  vehiclesCreated: number
  vehiclesSkipped: number
}

// Siembra idempotente de vehicles para el entorno local vía RegisterVehicleUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class VehicleLocalSeeder {
  constructor(private readonly registerVehicle: RegisterVehicleUseCase) {}

  async seed(vehicles: RegisterVehicleInput[]): Promise<VehicleSeedSummary> {
    const summary: VehicleSeedSummary = {
      vehiclesCreated: 0,
      vehiclesSkipped: 0
    }

    for (const vehicle of vehicles) {
      try {
        await this.registerVehicle.invoke(vehicle)
        summary.vehiclesCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.vehiclesSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
