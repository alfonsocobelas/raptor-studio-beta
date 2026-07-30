import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { ProjectId } from '../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectName } from './value-objects/project-name.vo'
import { Project } from './project'

export abstract class ProjectRepository {
  abstract register(project: Project): Promise<void>
  abstract save(project: Project): Promise<void>
  abstract remove(projectId: ProjectId): Promise<void>
  abstract get(projectId: ProjectId): Promise<Nullable<Project>>
  abstract matching(criteria: Criteria): Promise<Project[]>
  abstract findByName(name: ProjectName): Promise<Nullable<Project>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
}
