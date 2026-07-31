import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { Sku } from '../value-objects/sku.vo'

export class GarmentWithSkuSpecification extends Criteria {
  private constructor(sku: Sku) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('sku'), FilterOperator.create(Operator.EQUAL), FilterValue.create(sku.value))
      ])
    })
  }

  static withSku(sku: Sku): GarmentWithSkuSpecification {
    return new GarmentWithSkuSpecification(sku)
  }
}

export const withSku = GarmentWithSkuSpecification.withSku
