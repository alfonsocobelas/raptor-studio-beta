import { Injectable } from '@nestjs/common'
import { CustomerDetailDto } from '@sap-licenses/shared/domain'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { CustomerRepository } from '../../domain/customer-repository'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { GetCustomerInput } from '../dtos/get-customer-input.dto'

@Injectable()
export class GetCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async invoke(input: GetCustomerInput): Promise<CustomerDetailDto> {
    const customerId = CustomerId.create(input.id)
    const aggregate = await this.customerRepository.get(customerId)

    if (!aggregate) {
      throw new EntityNotFoundError('Customer', input.id)
    }

    const customer = aggregate.toPrimitives()
    const contacts = aggregate.contacts.map(contact => contact.toPrimitives())

    return {
      ...customer,
      contacts,
      status: customer.status ?? 'active',
      archivedAt: customer.archivedAt ?? null,
      lastSeenInSyncAt: customer.lastSeenInSyncAt ?? null,
      city: customer.city ?? '',
      country: customer.country ?? '',
      customerType: customer.customerType as CustomerDetailDto['customerType']
    }
  }
}
