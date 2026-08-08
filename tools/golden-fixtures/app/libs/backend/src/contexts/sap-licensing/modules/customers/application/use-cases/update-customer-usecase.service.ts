import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { CustomerRepository } from '../../domain/customer-repository'
import { withSapId } from '../../domain/specifications/customer-with-sap-id.specification'
import { withTaxId } from '../../domain/specifications/customer-with-tax-id.specification'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { UpdateCustomerInput } from '../dtos/update-customer-input.dto'

@Injectable()
export class UpdateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async invoke(input: UpdateCustomerInput): Promise<void> {
    const customerId = CustomerId.create(input.id)
    const customer = await this.customerRepository.get(customerId)

    if (!customer) {
      throw new EntityNotFoundError('Customer', input.id)
    }

    const newSapId = customer.newSapIdIfChanged(input.updates)

    if (newSapId) {
      const sapIdExists = await this.customerRepository.exists(withSapId(newSapId))

      if (sapIdExists) {
        throw new AlreadyExistsError('Customer', 'sapId', newSapId.value)
      }
    }

    const newTaxId = customer.newTaxIdIfChanged(input.updates)

    if (newTaxId) {
      const taxIdExists = await this.customerRepository.exists(withTaxId(newTaxId))

      if (taxIdExists) {
        throw new AlreadyExistsError('Customer', 'taxId', newTaxId.value)
      }
    }

    customer.updateDetails(input.updates)
    await this.customerRepository.save(customer)
  }
}
