import { Customer } from '../../../domain/customer'
import { Contact } from '../../../domain/contact'
import { TypeOrmContactEntity } from './typeorm-contact.entity'
import { TypeOrmCustomerEntity } from './typeorm-customer.entity'

export class CustomerMapper {
  static toDomain(customerEntity: TypeOrmCustomerEntity, contactEntities: TypeOrmContactEntity[] = []): Customer {
    return Customer.fromPrimitives(
      {
        id: customerEntity.id,
        sapId: customerEntity.sapId,
        name: customerEntity.name,
        taxId: customerEntity.taxId,
        industry: customerEntity.industry,
        address: customerEntity.address,
        phone: customerEntity.phone,
        notes: customerEntity.notes,
        status: customerEntity.status,
        archivedAt: customerEntity.archivedAt?.toISOString() ?? null,
        lastSeenInSyncAt: customerEntity.lastSeenInSyncAt?.toISOString() ?? null,
        city: customerEntity.city,
        country: customerEntity.country,
        customerType: customerEntity.customerType
      },
      contactEntities.map(contact => ({
        id: contact.id,
        customerId: contact.customerId,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.isPrimary
      }))
    )
  }

  static toPersistence(domain: Customer): TypeOrmCustomerEntity {
    const entity = new TypeOrmCustomerEntity()
    entity.id = domain.id.value
    entity.sapId = domain.sapId.value
    entity.name = domain.name.value
    entity.taxId = domain.taxId.value
    entity.industry = domain.industry.value
    entity.address = domain.address.value
    entity.phone = domain.phone.value
    entity.notes = domain.notes.value
    entity.status = domain.status.value
    entity.archivedAt = domain.archivedAt ? domain.archivedAt.value : null
    entity.lastSeenInSyncAt = domain.lastSeenInSyncAt ? domain.lastSeenInSyncAt.value : null
    entity.city = domain.city.value
    entity.country = domain.country.value
    entity.customerType = domain.customerType.value

    return entity
  }

  static contactsToPersistence(domain: Customer): TypeOrmContactEntity[] {
    return domain.contacts.map(CustomerMapper.contactToPersistence)
  }

  static contactToPersistence(contact: Contact): TypeOrmContactEntity {
    const primitives = contact.toPrimitives()
    const entity = new TypeOrmContactEntity()
    entity.id = primitives.id
    entity.customerId = primitives.customerId
    entity.name = primitives.name
    entity.role = primitives.role
    entity.email = primitives.email
    entity.phone = primitives.phone
    entity.isPrimary = primitives.isPrimary

    return entity
  }
}
