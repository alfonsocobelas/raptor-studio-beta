import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterClientInput } from '../../application/dtos/register-client-input.dto'
import { RegisterClientUseCase } from '../../application/use-cases/register-client-usecase.service'

export interface ClientSeedSummary {
  clientsCreated: number
  clientsSkipped: number
}

// Siembra idempotente de clients para el entorno local vía RegisterClientUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class ClientLocalSeeder {
  constructor(private readonly registerClient: RegisterClientUseCase) {}

  async seed(clients: RegisterClientInput[]): Promise<ClientSeedSummary> {
    const summary: ClientSeedSummary = {
      clientsCreated: 0,
      clientsSkipped: 0
    }

    for (const client of clients) {
      try {
        await this.registerClient.invoke(client)
        summary.clientsCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.clientsSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
