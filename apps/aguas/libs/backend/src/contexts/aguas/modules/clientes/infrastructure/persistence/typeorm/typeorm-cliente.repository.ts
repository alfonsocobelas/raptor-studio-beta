import { Injectable } from '@nestjs/common'
import { IsNull, Not } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ClienteId } from '../../../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Cliente } from '../../../domain/cliente'
import { ClienteRepository } from '../../../domain/cliente-repository'
import { ClienteMapper } from './cliente.mapper'
import { TypeOrmClienteEntity } from './typeorm-cliente.entity'

@Injectable()
export class TypeOrmClienteRepository extends TypeOrmRepository<TypeOrmClienteEntity> implements ClienteRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmClienteEntity
  }

  async register(cliente: Cliente): Promise<void> {
    await this.repository().save(ClienteMapper.toPersistence(cliente))
  }

  async save(cliente: Cliente): Promise<void> {
    await this.repository().save(ClienteMapper.toPersistence(cliente))
  }

  // Archiva la fila viva marcando QUÉ operación la tumbó; un update, se une a la tx ambiental
  async remove(clienteId: ClienteId, op: DeleteOperationId): Promise<void> {
    await this.repository().update(
      { id: clienteId.value, deletedAt: IsNull() },
      { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value }
    )
  }

  // Revierte UNA operación: vuelve exactamente lo que ella arrastró (decisión 1, spec 38)
  async restoreByOp(op: DeleteOperationId): Promise<number> {
    const result = await this.repository().update({ deletedOp: op.value }, { deletedAt: null, deletedOp: null })
    return result.affected ?? 0
  }

  // ¿Con qué operación cayó esta fila archivada? Es lo que el restore del padre revierte.
  async deletedOpOf(clienteId: ClienteId): Promise<Nullable<DeleteOperationId>> {
    const row = await this.repository().findOne({
      select: { deletedOp: true },
      where: { id: clienteId.value, deletedAt: Not(IsNull()) },
      withDeleted: true
    })
    return row?.deletedOp ? DeleteOperationId.create(row.deletedOp) : null
  }

  async get(clienteId: ClienteId): Promise<Nullable<Cliente>> {
    const entity = await this.repository().findOneBy({ id: clienteId.value })
    return entity ? ClienteMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Cliente[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(ClienteMapper.toDomain)
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  async matchingDeleted(criteria: Criteria): Promise<Cliente[]> {
    const entities = await this.searchDeletedByCriteria(criteria)
    return entities.map(ClienteMapper.toDomain)
  }

  async countDeleted(criteria: Criteria): Promise<number> {
    return this.countDeletedByCriteria(criteria)
  }

  // Solo se restaura lo borrado: un id vivo (o inexistente) devuelve false y el use case da 404.
  async restore(clienteId: ClienteId): Promise<boolean> {
    const result = await this.repository().restore({ id: clienteId.value, deletedAt: Not(IsNull()) })
    return (result.affected ?? 0) > 0
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
