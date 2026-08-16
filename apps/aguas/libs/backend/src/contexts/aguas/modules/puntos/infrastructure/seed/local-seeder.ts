import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterPuntoInput } from '../../application/dtos/register-punto-input.dto'
import { RegisterPuntoUseCase } from '../../application/use-cases/register-punto-usecase.service'

export interface PuntoSeedSummary {
  puntosCreated: number
  puntosSkipped: number
}

// Siembra idempotente de puntos para el entorno local vía RegisterPuntoUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class PuntoLocalSeeder {
  constructor(private readonly registerPunto: RegisterPuntoUseCase) {}

  async seed(puntos: RegisterPuntoInput[]): Promise<PuntoSeedSummary> {
    const summary: PuntoSeedSummary = {
      puntosCreated: 0,
      puntosSkipped: 0
    }

    for (const punto of puntos) {
      try {
        await this.registerPunto.invoke(punto)
        summary.puntosCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.puntosSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
