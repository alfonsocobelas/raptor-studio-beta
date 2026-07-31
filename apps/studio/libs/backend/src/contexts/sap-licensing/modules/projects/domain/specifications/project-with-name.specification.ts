import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ProjectName } from '../value-objects/project-name.vo'

export class ProjectWithNameSpecification extends Criteria {
  private constructor(name: ProjectName) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('name'), FilterOperator.create(Operator.EQUAL), FilterValue.create(name.value))
      ])
    })
  }

  static withName(name: ProjectName): ProjectWithNameSpecification {
    return new ProjectWithNameSpecification(name)
  }
}

export const withName = ProjectWithNameSpecification.withName
