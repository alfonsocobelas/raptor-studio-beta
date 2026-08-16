import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterClienteInput } from '../../application/dtos/register-cliente-input.dto'
import { RegisterClienteUseCase } from '../../application/use-cases/register-cliente-usecase.service'

export interface ClienteSeedSummary {
  clientesCreated: number
  clientesSkipped: number
}

// Siembra idempotente de clientes para el entorno local vía RegisterClienteUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class ClienteLocalSeeder {
  constructor(private readonly registerCliente: RegisterClienteUseCase) {}

  async seed(clientes: RegisterClienteInput[]): Promise<ClienteSeedSummary> {
    const summary: ClienteSeedSummary = {
      clientesCreated: 0,
      clientesSkipped: 0
    }

    for (const cliente of clientes) {
      try {
        await this.registerCliente.invoke(cliente)
        summary.clientesCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.clientesSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
