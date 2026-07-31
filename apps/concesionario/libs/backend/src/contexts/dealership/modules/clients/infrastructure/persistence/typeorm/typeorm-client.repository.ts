import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ClientId } from '../../../../../../shared/domain/value-objects/clients/client-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Client } from '../../../domain/client'
import { ClientRepository } from '../../../domain/client-repository'
import { ClientTaxId } from '../../../domain/value-objects/client-tax-id.vo'
import { ClientMapper } from './client.mapper'
import { TypeOrmClientEntity } from './typeorm-client.entity'

@Injectable()
export class TypeOrmClientRepository extends TypeOrmRepository<TypeOrmClientEntity> implements ClientRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmClientEntity
  }

  async register(client: Client): Promise<void> {
    await this.repository().save(ClientMapper.toPersistence(client))
  }

  async save(client: Client): Promise<void> {
    await this.repository().save(ClientMapper.toPersistence(client))
  }

  async remove(clientId: ClientId): Promise<void> {
    await this.repository().delete({ id: clientId.value })
  }

  async get(clientId: ClientId): Promise<Nullable<Client>> {
    const entity = await this.repository().findOneBy({ id: clientId.value })
    return entity ? ClientMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Client[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(ClientMapper.toDomain)
  }

  async findByTaxId(taxId: ClientTaxId): Promise<Nullable<Client>> {
    const entity = await this.repository().findOneBy({ taxId: taxId.value })
    return entity ? ClientMapper.toDomain(entity) : null
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
