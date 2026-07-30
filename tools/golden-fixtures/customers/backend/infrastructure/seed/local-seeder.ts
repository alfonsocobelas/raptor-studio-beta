import { DataSource } from 'typeorm'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterCustomerInput } from '../../application/dtos/register-customer-input.dto'
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer-usecase.service'
import { Contact } from '../../domain/contact'
import { ContactPrimitiveProps } from '../../domain/customer-types'
import { CustomerMapper } from '../persistence/typeorm/customer.mapper'
import { TypeOrmContactEntity } from '../persistence/typeorm/typeorm-contact.entity'

export interface SeedSummary {
  customersCreated: number
  customersSkipped: number
  contactsCreated: number
  contactsSkipped: number
}

// Siembra idempotente de clientes y contactos para el entorno local.
// Clientes: vía RegisterCustomerUseCase (respeta invariantes); duplicados se saltan
// capturando AlreadyExistsError. Contactos: vía repositorio TypeORM (no hay use case
// de alta de contacto en v1); se saltan si el id ya existe.
export class LocalSeeder {
  constructor(
    private readonly registerCustomer: RegisterCustomerUseCase,
    private readonly dataSource: DataSource
  ) {}

  async seed(customers: RegisterCustomerInput[], contacts: ContactPrimitiveProps[]): Promise<SeedSummary> {
    const summary: SeedSummary = {
      customersCreated: 0,
      customersSkipped: 0,
      contactsCreated: 0,
      contactsSkipped: 0
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

    const contactRepository = this.dataSource.getRepository(TypeOrmContactEntity)
    for (const contact of contacts) {
      if (await contactRepository.existsBy({ id: contact.id })) {
        summary.contactsSkipped++
        continue
      }
      await contactRepository.save(CustomerMapper.contactToPersistence(Contact.fromPrimitives(contact)))
      summary.contactsCreated++
    }

    return summary
  }
}
