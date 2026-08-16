import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ClienteId } from '../../../../../shared/domain/value-objects/clientes/cliente-id.vo'

export class ClienteWithIdSpecification extends Criteria {
  private constructor(id: ClienteId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: ClienteId): ClienteWithIdSpecification {
    return new ClienteWithIdSpecification(id)
  }
}

export const withClienteId = ClienteWithIdSpecification.withId
