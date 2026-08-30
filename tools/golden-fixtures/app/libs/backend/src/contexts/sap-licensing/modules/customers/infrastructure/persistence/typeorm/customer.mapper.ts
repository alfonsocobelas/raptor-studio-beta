import { Contact } from '../../../domain/contact'
import { Customer } from '../../../domain/customer'
import { TypeOrmContactEntity } from './typeorm-contact.entity'
import { TypeOrmCustomerEntity } from './typeorm-customer.entity'

export class CustomerMapper {
  static toDomain(entity: TypeOrmCustomerEntity, contactsEntities: TypeOrmContactEntity[] = []): Customer {
    return Customer.fromPrimitives(
      {
        id: entity.id,
        sapId: entity.sapId,
        name: entity.name,
        taxId: entity.taxId,
        industry: entity.industry,
        address: entity.address,
        phone: entity.phone,
        notes: entity.notes,
        city: entity.city,
        country: entity.country,
        customerType: entity.customerType,
        status: entity.status,
        archivedAt: entity.archivedAt?.toISOString() ?? null,
        lastSeenInSyncAt: entity.lastSeenInSyncAt?.toISOString() ?? null,
        version: entity.version
      },
      contactsEntities.map(contactEntity => ({
        id: contactEntity.id,
        customerId: contactEntity.customerId,
        name: contactEntity.name,
        role: contactEntity.role,
        email: contactEntity.email,
        phone: contactEntity.phone,
        isPrimary: contactEntity.isPrimary
      }))
    )
  }

  static toPersistence(domain: Customer): TypeOrmCustomerEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmCustomerEntity()
    entity.id = primitives.id
    entity.sapId = primitives.sapId
    entity.name = primitives.name
    entity.taxId = primitives.taxId
    entity.industry = primitives.industry
    entity.address = primitives.address
    entity.phone = primitives.phone
    entity.notes = primitives.notes
    entity.city = primitives.city ?? ''
    entity.country = primitives.country ?? ''
    entity.customerType = primitives.customerType
    entity.status = primitives.status ?? 'active'
    entity.archivedAt = primitives.archivedAt ? new Date(primitives.archivedAt) : null
    entity.lastSeenInSyncAt = primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null
    entity.version = primitives.version

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end

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
