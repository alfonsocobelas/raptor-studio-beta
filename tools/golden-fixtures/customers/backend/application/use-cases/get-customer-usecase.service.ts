import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { CustomerRepository } from '../../domain/customer-repository'
import { ContactPrimitiveProps, CustomerPrimitiveProps } from '../../domain/customer-types'
import { GetCustomerInput } from '../dtos/get-customer-input.dto'

export interface CustomerDetailOutput extends CustomerPrimitiveProps {
  contacts: ContactPrimitiveProps[]
}

@Injectable()
export class GetCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async invoke(input: GetCustomerInput): Promise<CustomerDetailOutput> {
    const customerId = CustomerId.create(input.id)
    const customer = await this.customerRepository.get(customerId)

    if (!customer) {
      throw new EntityNotFoundError('Customer', input.id)
    }

    return {
      ...customer.toPrimitives(),
      contacts: customer.contacts.map(contact => contact.toPrimitives())
    }
  }
}
