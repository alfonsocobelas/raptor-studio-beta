import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { VehicleId } from '../../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'

export class VehicleWithIdSpecification extends Criteria {
  private constructor(id: VehicleId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: VehicleId): VehicleWithIdSpecification {
    return new VehicleWithIdSpecification(id)
  }
}

export const withVehicleId = VehicleWithIdSpecification.withId
