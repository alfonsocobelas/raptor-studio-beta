import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'

/**
 * Localiza la licencia ME_SAP de un material concreto por su clave natural
 * (contractNumber, materialId). El único parcial en BD (source='ME_SAP') garantiza 0..1.
 */
export class LicenseWithContractAndMaterialSpecification extends Criteria {
  private constructor(contractNumber: string, materialId: string) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('contractNumber'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(contractNumber)
        ),
        new Filter(
          FilterField.create('materialId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(materialId)
        ),
        new Filter(FilterField.create('source'), FilterOperator.create(Operator.EQUAL), FilterValue.create('ME_SAP'))
      ])
    })
  }

  static of(contractNumber: string, materialId: string): LicenseWithContractAndMaterialSpecification {
    return new LicenseWithContractAndMaterialSpecification(contractNumber, materialId)
  }
}

export const withContractAndMaterial = LicenseWithContractAndMaterialSpecification.of
