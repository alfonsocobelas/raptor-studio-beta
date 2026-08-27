import { Injectable } from '@nestjs/common'
import { FindOptionsWhere, In, Not } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { AggregateOp } from '../../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { CustomerId } from '../../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Customer } from '../../../domain/customer'
import { CustomerRepository } from '../../../domain/customer-repository'
import { SapId } from '../../../domain/value-objects/sap-id.vo'
import { TaxId } from '../../../domain/value-objects/tax-id.vo'
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

  // Persiste el agregado completo: customer + upsert de contacts + soft-delete de los que
  // ya no viven en el agregado (materializa removeContact). Usa this.client(), así que se une a la
  // transacción que abra el use case (el boundary transaccional vive en la aplicación, no aquí).
  // El agregado siempre llega hidratado, así que el diff nunca borra contacts por hidratación parcial.
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

  async findBySapId(sapId: SapId): Promise<Nullable<Customer>> {
    const entity = await this.repository().findOneBy({ sapId: sapId.value })
    return entity ? this.hydrateOne(entity) : null
  }

  async findByTaxId(taxId: TaxId): Promise<Nullable<Customer>> {
    const entity = await this.repository().findOneBy({ taxId: taxId.value })
    return entity ? this.hydrateOne(entity) : null
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  async aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null> {
    return this.aggregateByCriteria(criteria, op, field)
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end

  // Contacts que ya no viven en el agregado y hay que soft-borrar (diff contra la BD).
  // Guard: In([]) genera `NOT IN ()`, SQL inválido. Sin supervivientes = todos los del padre son huérfanos.
  private orphanedContactsWhere(customerId: string, keptIds: string[]): FindOptionsWhere<TypeOrmContactEntity> {
    if (!keptIds.length) {
      return { customerId }
    }

    return { customerId, id: Not(In(keptIds)) }
  }

  private async hydrateOne(entity: TypeOrmCustomerEntity): Promise<Customer> {
    return (await this.hydrate([entity]))[0]
  }

  private async hydrate(entities: TypeOrmCustomerEntity[]): Promise<Customer[]> {
    if (!entities.length) {
      return []
    }

    const parentIds = entities.map(entity => entity.id)

    const contactEntities = await this.client()
      .getRepository(TypeOrmContactEntity)
      .find({ where: { customerId: In(parentIds) }, order: { id: 'ASC' } })

    const contactsByParent = new Map<string, TypeOrmContactEntity[]>()

    for (const contact of contactEntities) {
      const group = contactsByParent.get(contact.customerId) ?? []
      group.push(contact)
      contactsByParent.set(contact.customerId, group)
    }

    return entities.map(entity => CustomerMapper.toDomain(entity, contactsByParent.get(entity.id)))
  }
}
