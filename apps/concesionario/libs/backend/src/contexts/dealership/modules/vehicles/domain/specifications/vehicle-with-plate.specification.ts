import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { Plate } from '../value-objects/plate.vo'

export class VehicleWithPlateSpecification extends Criteria {
  private constructor(plate: Plate) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('plate'), FilterOperator.create(Operator.EQUAL), FilterValue.create(plate.value))
      ])
    })
  }

  static withPlate(plate: Plate): VehicleWithPlateSpecification {
    return new VehicleWithPlateSpecification(plate)
  }
}

export const withPlate = VehicleWithPlateSpecification.withPlate
