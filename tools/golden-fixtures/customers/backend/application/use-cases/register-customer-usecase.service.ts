import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Customer } from '../../domain/customer'
import { CustomerRepository } from '../../domain/customer-repository'
import { withSapId } from '../../domain/specifications/customer-with-sap-id.specification'
import { withTaxId } from '../../domain/specifications/customer-with-tax-id.specification'
import { RegisterCustomerInput } from '../dtos/register-customer-input.dto'

@Injectable()
export class RegisterCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async invoke(input: RegisterCustomerInput): Promise<void> {
    const customer = Customer.register(input)
    const sapIdExists = await this.customerRepository.exists(withSapId(customer.sapId))

    if (sapIdExists) {
      throw new AlreadyExistsError('Customer', 'sapId', customer.sapId.value)
    }

    const taxIdExists = await this.customerRepository.exists(withTaxId(customer.taxId))

    if (taxIdExists) {
      throw new AlreadyExistsError('Customer', 'taxId', customer.taxId.value)
    }

    await this.customerRepository.register(customer)
  }
}
