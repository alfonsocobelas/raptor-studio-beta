import { Injectable } from '@nestjs/common'
import { In, IsNull } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ProjectId } from '../../../../../../shared/domain/value-objects/projects/project-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Project } from '../../../domain/project'
import { ProjectRepository } from '../../../domain/project-repository'
import { ProjectName } from '../../../domain/value-objects/project-name.vo'
import { ProjectMapper } from './project.mapper'
import { TypeOrmProjectEntity } from './typeorm-project.entity'

@Injectable()
export class TypeOrmProjectRepository extends TypeOrmRepository<TypeOrmProjectEntity> implements ProjectRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmProjectEntity
  }

  async register(project: Project): Promise<void> {
    await this.repository().save(ProjectMapper.toPersistence(project))
  }

  async save(project: Project): Promise<void> {
    await this.repository().save(ProjectMapper.toPersistence(project))
  }

  // Archiva la fila viva marcando QUÉ operación la tumbó; un update, se une a la tx ambiental
  async remove(projectId: ProjectId, op: DeleteOperationId): Promise<void> {
    await this.repository().update(
      { id: projectId.value, deletedAt: IsNull() },
      { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value }
    )
  }

  async removeDraggedByCustomerId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    if (!parentIds.length) return []
    const rows = await this.repository().find({
      select: { id: true },
      where: { customerId: In(parentIds), deletedAt: IsNull() }
    })
    const ids = rows.map(row => row.id)
    if (ids.length) {
      await this.repository().update({ id: In(ids) }, { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value })
    }
    return ids
  }

  async get(projectId: ProjectId): Promise<Nullable<Project>> {
    const entity = await this.repository().findOneBy({ id: projectId.value })
    return entity ? ProjectMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Project[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(ProjectMapper.toDomain)
  }

  async findByName(name: ProjectName): Promise<Nullable<Project>> {
    const entity = await this.repository().findOneBy({ name: name.value })
    return entity ? ProjectMapper.toDomain(entity) : null
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

  async aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]> {
    return this.aggregateGroupedByCriteria(criteria, spec)
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
