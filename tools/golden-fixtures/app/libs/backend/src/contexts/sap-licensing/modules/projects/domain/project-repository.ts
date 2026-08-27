import { Nullable } from '../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../shared/domain/query/aggregate'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { ProjectId } from '../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectName } from './value-objects/project-name.vo'
import { Project } from './project'

export abstract class ProjectRepository {
  abstract register(project: Project): Promise<void>
  abstract save(project: Project): Promise<void>
  abstract remove(projectId: ProjectId, op: DeleteOperationId): Promise<void>
  abstract removeDraggedByCustomerId(parentIds: string[], op: DeleteOperationId): Promise<string[]>
  abstract get(projectId: ProjectId): Promise<Nullable<Project>>
  abstract matching(criteria: Criteria): Promise<Project[]>
  abstract findByName(name: ProjectName): Promise<Nullable<Project>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  /** Una agregación del conjunto filtrado (spec 71). `null` = no hay dato, que no es lo mismo que 0. */
  abstract aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null>
  /** El desglose de una agregación, en una sola consulta (spec 72). */
  abstract aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
