import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { Vin } from '../value-objects/vin.vo'

export class VehicleWithVinSpecification extends Criteria {
  private constructor(vin: Vin) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('vin'), FilterOperator.create(Operator.EQUAL), FilterValue.create(vin.value))
      ])
    })
  }

  static withVin(vin: Vin): VehicleWithVinSpecification {
    return new VehicleWithVinSpecification(vin)
  }
}

export const withVin = VehicleWithVinSpecification.withVin
