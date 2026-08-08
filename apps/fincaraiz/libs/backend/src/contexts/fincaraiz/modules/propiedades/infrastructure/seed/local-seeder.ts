import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterPropiedadInput } from '../../application/dtos/register-propiedad-input.dto'
import { RegisterPropiedadUseCase } from '../../application/use-cases/register-propiedad-usecase.service'

export interface PropiedadSeedSummary {
  propiedadesCreated: number
  propiedadesSkipped: number
}

// Siembra idempotente de propiedades para el entorno local vía RegisterPropiedadUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class PropiedadLocalSeeder {
  constructor(private readonly registerPropiedad: RegisterPropiedadUseCase) {}

  async seed(propiedades: RegisterPropiedadInput[]): Promise<PropiedadSeedSummary> {
    const summary: PropiedadSeedSummary = {
      propiedadesCreated: 0,
      propiedadesSkipped: 0
    }

    for (const propiedad of propiedades) {
      try {
        await this.registerPropiedad.invoke(propiedad)
        summary.propiedadesCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.propiedadesSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
