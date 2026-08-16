import { Injectable } from '@nestjs/common'
import { In, IsNull, Not } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { PuntoId } from '../../../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Punto } from '../../../domain/punto'
import { PuntoRepository } from '../../../domain/punto-repository'
import { PuntoMapper } from './punto.mapper'
import { TypeOrmPuntoEntity } from './typeorm-punto.entity'

@Injectable()
export class TypeOrmPuntoRepository extends TypeOrmRepository<TypeOrmPuntoEntity> implements PuntoRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmPuntoEntity
  }

  async register(punto: Punto): Promise<void> {
    await this.repository().save(PuntoMapper.toPersistence(punto))
  }

  async save(punto: Punto): Promise<void> {
    await this.repository().save(PuntoMapper.toPersistence(punto))
  }

  // Archiva la fila viva marcando QUÉ operación la tumbó; un update, se une a la tx ambiental
  async remove(puntoId: PuntoId, op: DeleteOperationId): Promise<void> {
    await this.repository().update(
      { id: puntoId.value, deletedAt: IsNull() },
      { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value }
    )
  }

  async removeDraggedByClienteId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    if (!parentIds.length) return []
    const rows = await this.repository().find({
      select: { id: true },
      where: { clienteId: In(parentIds), deletedAt: IsNull() }
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

  // ¿Con qué operación cayó esta fila archivada? Es lo que el restore del padre revierte.
  async deletedOpOf(puntoId: PuntoId): Promise<Nullable<DeleteOperationId>> {
    const row = await this.repository().findOne({
      select: { deletedOp: true },
      where: { id: puntoId.value, deletedAt: Not(IsNull()) },
      withDeleted: true
    })
    return row?.deletedOp ? DeleteOperationId.create(row.deletedOp) : null
  }

  async get(puntoId: PuntoId): Promise<Nullable<Punto>> {
    const entity = await this.repository().findOneBy({ id: puntoId.value })
    return entity ? PuntoMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Punto[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(PuntoMapper.toDomain)
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  async matchingDeleted(criteria: Criteria): Promise<Punto[]> {
    const entities = await this.searchDeletedByCriteria(criteria)
    return entities.map(PuntoMapper.toDomain)
  }

  async countDeleted(criteria: Criteria): Promise<number> {
    return this.countDeletedByCriteria(criteria)
  }

  // Solo se restaura lo borrado: un id vivo (o inexistente) devuelve false y el use case da 404.
  async restore(puntoId: PuntoId): Promise<boolean> {
    const result = await this.repository().restore({ id: puntoId.value, deletedAt: Not(IsNull()) })
    return (result.affected ?? 0) > 0
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
