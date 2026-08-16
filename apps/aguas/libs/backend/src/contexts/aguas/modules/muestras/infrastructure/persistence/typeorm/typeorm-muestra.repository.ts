import { Injectable } from '@nestjs/common'
import { In, IsNull, Not } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { MuestraId } from '../../../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Muestra } from '../../../domain/muestra'
import { MuestraRepository } from '../../../domain/muestra-repository'
import { MuestraMapper } from './muestra.mapper'
import { TypeOrmMuestraEntity } from './typeorm-muestra.entity'

@Injectable()
export class TypeOrmMuestraRepository extends TypeOrmRepository<TypeOrmMuestraEntity> implements MuestraRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmMuestraEntity
  }

  async register(muestra: Muestra): Promise<void> {
    await this.repository().save(MuestraMapper.toPersistence(muestra))
  }

  async save(muestra: Muestra): Promise<void> {
    await this.repository().save(MuestraMapper.toPersistence(muestra))
  }

  // Archiva la fila viva marcando QUÉ operación la tumbó; un update, se une a la tx ambiental
  async remove(muestraId: MuestraId, op: DeleteOperationId): Promise<void> {
    await this.repository().update(
      { id: muestraId.value, deletedAt: IsNull() },
      { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value }
    )
  }

  async removeDraggedByPuntoId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    if (!parentIds.length) return []
    const rows = await this.repository().find({
      select: { id: true },
      where: { puntoId: In(parentIds), deletedAt: IsNull() }
    })
    const ids = rows.map(row => row.id)
    if (ids.length) {
      await this.repository().update({ id: In(ids) }, { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value })
    }
    return ids
  }

  // Revierte UNA operación: vuelve exactamente lo que ella arrastró (decisión 1, spec 38)
  async restoreByOp(op: DeleteOperationId): Promise<number> {
    const result = await this.repository().update({ deletedOp: op.value }, { deletedAt: null, deletedOp: null })
    return result.affected ?? 0
  }

  async get(muestraId: MuestraId): Promise<Nullable<Muestra>> {
    const entity = await this.repository().findOneBy({ id: muestraId.value })
    return entity ? MuestraMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Muestra[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(MuestraMapper.toDomain)
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  async matchingDeleted(criteria: Criteria): Promise<Muestra[]> {
    const entities = await this.searchDeletedByCriteria(criteria)
    return entities.map(MuestraMapper.toDomain)
  }

  async countDeleted(criteria: Criteria): Promise<number> {
    return this.countDeletedByCriteria(criteria)
  }

  // Solo se restaura lo borrado: un id vivo (o inexistente) devuelve false y el use case da 404.
  async restore(muestraId: MuestraId): Promise<boolean> {
    const result = await this.repository().restore({ id: muestraId.value, deletedAt: Not(IsNull()) })
    return (result.affected ?? 0) > 0
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
