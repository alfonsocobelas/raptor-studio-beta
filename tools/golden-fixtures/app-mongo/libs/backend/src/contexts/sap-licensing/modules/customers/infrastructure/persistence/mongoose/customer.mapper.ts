import { Contact } from '../../../domain/contact'
import { Customer } from '../../../domain/customer'
import { ContactDoc, CustomerDoc } from './customer.schema'

export class CustomerMapper {
  static toDomain(doc: CustomerDoc): Customer {
    return Customer.fromPrimitives(
      {
        id: doc.id,
        sapId: doc.sapId,
        name: doc.name,
        taxId: doc.taxId,
        industry: doc.industry,
        address: doc.address,
        phone: doc.phone,
        notes: doc.notes,
        city: doc.city,
        country: doc.country,
        customerType: doc.customerType,
        status: doc.status,
        archivedAt: doc.archivedAt?.toISOString() ?? null,
        lastSeenInSyncAt: doc.lastSeenInSyncAt?.toISOString() ?? null
      },
      (doc.contacts ?? []).map(contact => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.isPrimary,
        // la clave del padre no vive en el subdocumento: se repone desde el id del agregado
        customerId: doc.id
      }))
    )
  }

  // El documento se reemplaza entero en cada save: los hijos embebidos viajan dentro,
  // así que no hay dos escrituras que coordinar (esa es la ventaja del agregado embebido)
  static toPersistence(domain: Customer): CustomerDoc {
    const primitives = domain.toPrimitives()

    return {
      id: primitives.id,
      sapId: primitives.sapId,
      name: primitives.name,
      taxId: primitives.taxId,
      industry: primitives.industry,
      address: primitives.address,
      phone: primitives.phone,
      notes: primitives.notes,
      city: primitives.city ?? '',
      country: primitives.country ?? '',
      customerType: primitives.customerType,
      status: primitives.status ?? 'active',
      archivedAt: primitives.archivedAt ? new Date(primitives.archivedAt) : null,
      lastSeenInSyncAt: primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null,
      contacts: domain.contacts.map(CustomerMapper.contactToPersistence)
    }
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end

  static contactToPersistence(contact: Contact): ContactDoc {
    const primitives = contact.toPrimitives()

    return {
      id: primitives.id,
      name: primitives.name,
      role: primitives.role ?? '',
      email: primitives.email ?? '',
      phone: primitives.phone ?? '',
      isPrimary: primitives.isPrimary
    }
  }
}
