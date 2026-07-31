import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { GarmentId } from '../../../../../shared/domain/value-objects/garments/garment-id.vo'

export class GarmentWithIdSpecification extends Criteria {
  private constructor(id: GarmentId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: GarmentId): GarmentWithIdSpecification {
    return new GarmentWithIdSpecification(id)
  }
}

export const withGarmentId = GarmentWithIdSpecification.withId
