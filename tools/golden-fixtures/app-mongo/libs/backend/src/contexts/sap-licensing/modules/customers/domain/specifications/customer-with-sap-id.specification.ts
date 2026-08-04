import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { SapId } from '../value-objects/sap-id.vo'

export class CustomerWithSapIdSpecification extends Criteria {
  private constructor(sapId: SapId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('sapId'), FilterOperator.create(Operator.EQUAL), FilterValue.create(sapId.value))
      ])
    })
  }

  static withSapId(sapId: SapId): CustomerWithSapIdSpecification {
    return new CustomerWithSapIdSpecification(sapId)
  }
}

export const withSapId = CustomerWithSapIdSpecification.withSapId
