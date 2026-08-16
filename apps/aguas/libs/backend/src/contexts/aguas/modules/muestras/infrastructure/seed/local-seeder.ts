import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterMuestraInput } from '../../application/dtos/register-muestra-input.dto'
import { RegisterMuestraUseCase } from '../../application/use-cases/register-muestra-usecase.service'

export interface MuestraSeedSummary {
  muestrasCreated: number
  muestrasSkipped: number
}

// Siembra idempotente de muestras para el entorno local vía RegisterMuestraUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class MuestraLocalSeeder {
  constructor(private readonly registerMuestra: RegisterMuestraUseCase) {}

  async seed(muestras: RegisterMuestraInput[]): Promise<MuestraSeedSummary> {
    const summary: MuestraSeedSummary = {
      muestrasCreated: 0,
      muestrasSkipped: 0
    }

    for (const muestra of muestras) {
      try {
        await this.registerMuestra.invoke(muestra)
        summary.muestrasCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.muestrasSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
