import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { PropiedadId } from '../../../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Propiedad } from '../../../domain/propiedad'
import { PropiedadRepository } from '../../../domain/propiedad-repository'
import { PropiedadMapper } from './propiedad.mapper'
import { TypeOrmPropiedadEntity } from './typeorm-propiedad.entity'

@Injectable()
export class TypeOrmPropiedadRepository
  extends TypeOrmRepository<TypeOrmPropiedadEntity>
  implements PropiedadRepository
{
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmPropiedadEntity
  }

  async register(propiedad: Propiedad): Promise<void> {
    await this.repository().save(PropiedadMapper.toPersistence(propiedad))
  }

  async save(propiedad: Propiedad): Promise<void> {
    await this.repository().save(PropiedadMapper.toPersistence(propiedad))
  }

  async remove(propiedadId: PropiedadId): Promise<void> {
    await this.repository().delete({ id: propiedadId.value })
  }

  async get(propiedadId: PropiedadId): Promise<Nullable<Propiedad>> {
    const entity = await this.repository().findOneBy({ id: propiedadId.value })
    return entity ? PropiedadMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Propiedad[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(PropiedadMapper.toDomain)
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
