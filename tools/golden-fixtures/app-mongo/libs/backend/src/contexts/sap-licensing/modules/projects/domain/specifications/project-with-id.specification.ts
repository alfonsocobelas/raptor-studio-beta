import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'

export class ProjectWithIdSpecification extends Criteria {
  private constructor(id: ProjectId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: ProjectId): ProjectWithIdSpecification {
    return new ProjectWithIdSpecification(id)
  }
}

export const withProjectId = ProjectWithIdSpecification.withId
