import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterCustomerInput } from '../../application/dtos/register-customer-input.dto'
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer-usecase.service'

export interface CustomerSeedSummary {
  customersCreated: number
  customersSkipped: number
}

// Siembra idempotente de customers para el entorno local vía RegisterCustomerUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class CustomerLocalSeeder {
  constructor(private readonly registerCustomer: RegisterCustomerUseCase) {}

  async seed(customers: RegisterCustomerInput[]): Promise<CustomerSeedSummary> {
    const summary: CustomerSeedSummary = {
      customersCreated: 0,
      customersSkipped: 0
    }

    for (const customer of customers) {
      try {
        await this.registerCustomer.invoke(customer)
        summary.customersCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.customersSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
