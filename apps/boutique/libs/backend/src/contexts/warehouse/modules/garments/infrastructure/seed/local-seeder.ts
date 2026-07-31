import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterGarmentInput } from '../../application/dtos/register-garment-input.dto'
import { RegisterGarmentUseCase } from '../../application/use-cases/register-garment-usecase.service'

export interface GarmentSeedSummary {
  garmentsCreated: number
  garmentsSkipped: number
}

// Siembra idempotente de garments para el entorno local vía RegisterGarmentUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class GarmentLocalSeeder {
  constructor(private readonly registerGarment: RegisterGarmentUseCase) {}

  async seed(garments: RegisterGarmentInput[]): Promise<GarmentSeedSummary> {
    const summary: GarmentSeedSummary = {
      garmentsCreated: 0,
      garmentsSkipped: 0
    }

    for (const garment of garments) {
      try {
        await this.registerGarment.invoke(garment)
        summary.garmentsCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.garmentsSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
