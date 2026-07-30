import { Injectable } from '@nestjs/common'
import { FindOptionsWhere, In, IsNull, Not } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Customer } from '../../../domain/customer'
import { CustomerRepository } from '../../../domain/customer-repository'
import { CustomerId } from '../../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { SapId } from '../../../domain/value-objects/sap-id.vo'
import { CustomerMapper } from './customer.mapper'
import { TypeOrmContactEntity } from './typeorm-contact.entity'
import { TypeOrmCustomerEntity } from './typeorm-customer.entity'

@Injectable()
export class TypeOrmCustomerRepository extends TypeOrmRepository<TypeOrmCustomerEntity> implements CustomerRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmCustomerEntity
  }

  async register(customer: Customer): Promise<void> {
    await this.repository().save(CustomerMapper.toPersistence(customer))
  }

  // Persiste el agregado completo: customer + upsert de contactos + soft-delete de los contactos que
  // ya no viven en el agregado (materializa removeContact). Usa this.client(), asi que se une a la
  // transaccion que abra el use case (el boundary transaccional vive en la aplicacion, no aqui).
  // El agregado siempre llega hidratado (get/matching/findBySapId/findArchivable), asi que el diff
  // nunca borra contactos por hidratacion parcial.
  async save(customer: Customer): Promise<void> {
    await this.repository().save(CustomerMapper.toPersistence(customer))

    const contactRepository = this.client().getRepository(TypeOrmContactEntity)
    const contactEntities = CustomerMapper.contactsToPersistence(customer)

    if (contactEntities.length) {
      await contactRepository.save(contactEntities)
    }

    const keptIds = contactEntities.map(contact => contact.id)
    await contactRepository.softDelete(this.orphanedContactsWhere(customer.id.value, keptIds))
  }

  async get(customerId: CustomerId): Promise<Nullable<Customer>> {
    const entity = await this.repository().findOneBy({ id: customerId.value })
    return entity ? this.hydrateOne(entity) : null
  }

  async matching(criteria: Criteria): Promise<Customer[]> {
    return this.hydrate(await this.searchByCriteria(criteria))
  }

  /** Candidatos a archivado: activos que el sync ha visto alguna vez en SAP. */
  async findArchivable(): Promise<Customer[]> {
    const entities = await this.repository().findBy({ status: 'active', lastSeenInSyncAt: Not(IsNull()) })
    return this.hydrate(entities)
  }

  async findBySapId(sapId: SapId): Promise<Nullable<Customer>> {
    const entity = await this.repository().findOneBy({ sapId: sapId.value })
    return entity ? this.hydrateOne(entity) : null
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  // Contactos que ya no viven en el agregado y hay que soft-borrar (diff contra la BD).
  // Guard: In([]) genera `NOT IN ()`, SQL invalido. Sin supervivientes = todos los del cliente son huerfanos.
  private orphanedContactsWhere(customerId: string, keptIds: string[]): FindOptionsWhere<TypeOrmContactEntity> {
    if (!keptIds.length) {
      return { customerId }
    }

    return { customerId, id: Not(In(keptIds)) }
  }

  private async hydrateOne(customerEntity: TypeOrmCustomerEntity): Promise<Customer> {
    return (await this.hydrate([customerEntity]))[0]
  }

  private async hydrate(customerEntities: TypeOrmCustomerEntity[]): Promise<Customer[]> {
    if (!customerEntities.length) {
      return []
    }

    const customerIds = customerEntities.map(customerEntity => customerEntity.id)

    const contactEntities = await this.client()
      .getRepository(TypeOrmContactEntity)
      .find({ where: { customerId: In(customerIds) }, order: { id: 'ASC' } })

    const contactsByCustomer = new Map<string, TypeOrmContactEntity[]>()

    for (const contact of contactEntities) {
      const group = contactsByCustomer.get(contact.customerId) ?? []
      group.push(contact)
      contactsByCustomer.set(contact.customerId, group)
    }

    return customerEntities.map(customerEntity => {
      const contactEntities = contactsByCustomer.get(customerEntity.id)

      return CustomerMapper.toDomain(customerEntity, contactEntities)
    })
  }
}
