import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { CustomerRepository } from '../../domain/customer-repository'
import { AddContactInput } from '../dtos/add-contact-input.dto'

@Injectable()
export class AddContactUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: AddContactInput): Promise<void> {
    const customerId = CustomerId.create(input.customerId)

    await this.txManager.runInTransaction(async () => {
      const customer = await this.customerRepository.get(customerId)

      if (!customer) {
        throw new EntityNotFoundError('Customer', input.customerId)
      }

      customer.addContact({
        id: input.contact.id,
        name: input.contact.name,
        role: input.contact.role ?? '',
        email: input.contact.email ?? '',
        phone: input.contact.phone ?? '',
        isPrimary: input.contact.isPrimary ?? false
      })

      await this.customerRepository.save(customer)
    })
  }
}
