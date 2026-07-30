import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ClientId } from '../../../../../shared/domain/value-objects/clients/client-id.vo'

export class ClientWithIdSpecification extends Criteria {
  private constructor(id: ClientId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: ClientId): ClientWithIdSpecification {
    return new ClientWithIdSpecification(id)
  }
}

export const withClientId = ClientWithIdSpecification.withId
