import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterSaleInput } from '../../application/dtos/register-sale-input.dto'
import { RegisterSaleUseCase } from '../../application/use-cases/register-sale-usecase.service'

export interface SaleSeedSummary {
  salesCreated: number
  salesSkipped: number
}

// Siembra idempotente de sales para el entorno local vía RegisterSaleUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class SaleLocalSeeder {
  constructor(private readonly registerSale: RegisterSaleUseCase) {}

  async seed(sales: RegisterSaleInput[]): Promise<SaleSeedSummary> {
    const summary: SaleSeedSummary = {
      salesCreated: 0,
      salesSkipped: 0
    }

    for (const sale of sales) {
      try {
        await this.registerSale.invoke(sale)
        summary.salesCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.salesSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
