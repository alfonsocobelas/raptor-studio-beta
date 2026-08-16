import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterParametroInput } from '../../application/dtos/register-parametro-input.dto'
import { RegisterParametroUseCase } from '../../application/use-cases/register-parametro-usecase.service'

export interface ParametroSeedSummary {
  parametrosCreated: number
  parametrosSkipped: number
}

// Siembra idempotente de parametros para el entorno local vía RegisterParametroUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class ParametroLocalSeeder {
  constructor(private readonly registerParametro: RegisterParametroUseCase) {}

  async seed(parametros: RegisterParametroInput[]): Promise<ParametroSeedSummary> {
    const summary: ParametroSeedSummary = {
      parametrosCreated: 0,
      parametrosSkipped: 0
    }

    for (const parametro of parametros) {
      try {
        await this.registerParametro.invoke(parametro)
        summary.parametrosCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.parametrosSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
