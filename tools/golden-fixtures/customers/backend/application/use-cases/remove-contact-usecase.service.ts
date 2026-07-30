import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContactId } from '../../domain/value-objects/contact-id.vo'
import { CustomerRepository } from '../../domain/customer-repository'
import { RemoveContactInput } from '../dtos/remove-contact-input.dto'

@Injectable()
export class RemoveContactUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: RemoveContactInput): Promise<void> {
    const customerId = CustomerId.create(input.customerId)
    const contactId = ContactId.create(input.contactId)

    await this.txManager.runInTransaction(async () => {
      const customer = await this.customerRepository.get(customerId)

      if (!customer) {
        throw new EntityNotFoundError('Customer', input.customerId)
      }

      customer.removeContact(contactId)
      await this.customerRepository.save(customer)
    })
  }
}
