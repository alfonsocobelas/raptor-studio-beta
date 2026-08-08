import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { AgenteId } from '../../../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Agente } from '../../../domain/agente'
import { AgenteRepository } from '../../../domain/agente-repository'
import { AgenteMapper } from './agente.mapper'
import { TypeOrmAgenteEntity } from './typeorm-agente.entity'

@Injectable()
export class TypeOrmAgenteRepository extends TypeOrmRepository<TypeOrmAgenteEntity> implements AgenteRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmAgenteEntity
  }

  async register(agente: Agente): Promise<void> {
    await this.repository().save(AgenteMapper.toPersistence(agente))
  }

  async save(agente: Agente): Promise<void> {
    await this.repository().save(AgenteMapper.toPersistence(agente))
  }

  async remove(agenteId: AgenteId): Promise<void> {
    await this.repository().delete({ id: agenteId.value })
  }

  async get(agenteId: AgenteId): Promise<Nullable<Agente>> {
    const entity = await this.repository().findOneBy({ id: agenteId.value })
    return entity ? AgenteMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Agente[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(AgenteMapper.toDomain)
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
