import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { SaleId } from '../../../../../shared/domain/value-objects/sales/sale-id.vo'

export class SaleWithIdSpecification extends Criteria {
  private constructor(id: SaleId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: SaleId): SaleWithIdSpecification {
    return new SaleWithIdSpecification(id)
  }
}

export const withSaleId = SaleWithIdSpecification.withId
