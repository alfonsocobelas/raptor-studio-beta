import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ProjectId } from '../../../../../../shared/domain/value-objects/projects/project-id.vo'
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

  async remove(projectId: ProjectId): Promise<void> {
    await this.repository().softDelete({ id: projectId.value })
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
}
