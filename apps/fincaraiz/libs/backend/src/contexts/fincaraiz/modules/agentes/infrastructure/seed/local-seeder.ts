import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterAgenteInput } from '../../application/dtos/register-agente-input.dto'
import { RegisterAgenteUseCase } from '../../application/use-cases/register-agente-usecase.service'

export interface AgenteSeedSummary {
  agentesCreated: number
  agentesSkipped: number
}

// Siembra idempotente de agentes para el entorno local vía RegisterAgenteUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class AgenteLocalSeeder {
  constructor(private readonly registerAgente: RegisterAgenteUseCase) {}

  async seed(agentes: RegisterAgenteInput[]): Promise<AgenteSeedSummary> {
    const summary: AgenteSeedSummary = {
      agentesCreated: 0,
      agentesSkipped: 0
    }

    for (const agente of agentes) {
      try {
        await this.registerAgente.invoke(agente)
        summary.agentesCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.agentesSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
