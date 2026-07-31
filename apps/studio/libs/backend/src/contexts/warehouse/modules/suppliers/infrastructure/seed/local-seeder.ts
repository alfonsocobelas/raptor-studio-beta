import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterSupplierInput } from '../../application/dtos/register-supplier-input.dto'
import { RegisterSupplierUseCase } from '../../application/use-cases/register-supplier-usecase.service'

export interface SupplierSeedSummary {
  suppliersCreated: number
  suppliersSkipped: number
}

// Siembra idempotente de suppliers para el entorno local vía RegisterSupplierUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class SupplierLocalSeeder {
  constructor(private readonly registerSupplier: RegisterSupplierUseCase) {}

  async seed(suppliers: RegisterSupplierInput[]): Promise<SupplierSeedSummary> {
    const summary: SupplierSeedSummary = {
      suppliersCreated: 0,
      suppliersSkipped: 0
    }

    for (const supplier of suppliers) {
      try {
        await this.registerSupplier.invoke(supplier)
        summary.suppliersCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.suppliersSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
