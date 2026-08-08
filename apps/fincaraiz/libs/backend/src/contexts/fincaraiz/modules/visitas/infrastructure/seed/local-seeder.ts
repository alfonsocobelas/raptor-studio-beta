import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterVisitaInput } from '../../application/dtos/register-visita-input.dto'
import { RegisterVisitaUseCase } from '../../application/use-cases/register-visita-usecase.service'

export interface VisitaSeedSummary {
  visitasCreated: number
  visitasSkipped: number
}

// Siembra idempotente de visitas para el entorno local vía RegisterVisitaUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class VisitaLocalSeeder {
  constructor(private readonly registerVisita: RegisterVisitaUseCase) {}

  async seed(visitas: RegisterVisitaInput[]): Promise<VisitaSeedSummary> {
    const summary: VisitaSeedSummary = {
      visitasCreated: 0,
      visitasSkipped: 0
    }

    for (const visita of visitas) {
      try {
        await this.registerVisita.invoke(visita)
        summary.visitasCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.visitasSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
