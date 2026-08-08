import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { AgenteId } from '../../../../../shared/domain/value-objects/agentes/agente-id.vo'

export class AgenteWithIdSpecification extends Criteria {
  private constructor(id: AgenteId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: AgenteId): AgenteWithIdSpecification {
    return new AgenteWithIdSpecification(id)
  }
}

export const withAgenteId = AgenteWithIdSpecification.withId
