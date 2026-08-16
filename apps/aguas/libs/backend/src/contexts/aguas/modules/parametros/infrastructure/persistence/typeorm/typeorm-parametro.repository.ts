import { Injectable } from '@nestjs/common'
import { IsNull, Not } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ParametroId } from '../../../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Parametro } from '../../../domain/parametro'
import { ParametroRepository } from '../../../domain/parametro-repository'
import { ParametroMapper } from './parametro.mapper'
import { TypeOrmParametroEntity } from './typeorm-parametro.entity'

@Injectable()
export class TypeOrmParametroRepository
  extends TypeOrmRepository<TypeOrmParametroEntity>
  implements ParametroRepository
{
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmParametroEntity
  }

  async register(parametro: Parametro): Promise<void> {
    await this.repository().save(ParametroMapper.toPersistence(parametro))
  }

  async save(parametro: Parametro): Promise<void> {
    await this.repository().save(ParametroMapper.toPersistence(parametro))
  }

  // Archiva la fila viva marcando QUÉ operación la tumbó; un update, se une a la tx ambiental
  async remove(parametroId: ParametroId, op: DeleteOperationId): Promise<void> {
    await this.repository().update(
      { id: parametroId.value, deletedAt: IsNull() },
      { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value }
    )
  }

  // Revierte UNA operación: vuelve exactamente lo que ella arrastró (decisión 1, spec 38)
  async restoreByOp(op: DeleteOperationId): Promise<number> {
    const result = await this.repository().update({ deletedOp: op.value }, { deletedAt: null, deletedOp: null })
    return result.affected ?? 0
  }

  async get(parametroId: ParametroId): Promise<Nullable<Parametro>> {
    const entity = await this.repository().findOneBy({ id: parametroId.value })
    return entity ? ParametroMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Parametro[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(ParametroMapper.toDomain)
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  async matchingDeleted(criteria: Criteria): Promise<Parametro[]> {
    const entities = await this.searchDeletedByCriteria(criteria)
    return entities.map(ParametroMapper.toDomain)
  }

  async countDeleted(criteria: Criteria): Promise<number> {
    return this.countDeletedByCriteria(criteria)
  }

  // Solo se restaura lo borrado: un id vivo (o inexistente) devuelve false y el use case da 404.
  async restore(parametroId: ParametroId): Promise<boolean> {
    const result = await this.repository().restore({ id: parametroId.value, deletedAt: Not(IsNull()) })
    return (result.affected ?? 0) > 0
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
