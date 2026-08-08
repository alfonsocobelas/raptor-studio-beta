import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { VisitaId } from '../../../../../../shared/domain/value-objects/visitas/visita-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Visita } from '../../../domain/visita'
import { VisitaRepository } from '../../../domain/visita-repository'
import { VisitaMapper } from './visita.mapper'
import { TypeOrmVisitaEntity } from './typeorm-visita.entity'

@Injectable()
export class TypeOrmVisitaRepository extends TypeOrmRepository<TypeOrmVisitaEntity> implements VisitaRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmVisitaEntity
  }

  async register(visita: Visita): Promise<void> {
    await this.repository().save(VisitaMapper.toPersistence(visita))
  }

  async save(visita: Visita): Promise<void> {
    await this.repository().save(VisitaMapper.toPersistence(visita))
  }

  async remove(visitaId: VisitaId): Promise<void> {
    await this.repository().delete({ id: visitaId.value })
  }

  async get(visitaId: VisitaId): Promise<Nullable<Visita>> {
    const entity = await this.repository().findOneBy({ id: visitaId.value })
    return entity ? VisitaMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Visita[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(VisitaMapper.toDomain)
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
