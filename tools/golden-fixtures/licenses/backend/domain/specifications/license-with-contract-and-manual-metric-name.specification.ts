import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'

/**
 * Localiza la licencia MANUAL de un contrato por su clave natural (contractId, metricName).
 * El índice único parcial en BD (source='MANUAL') garantiza 0..1. Las ME_SAP quedan fuera:
 * nacen sin metricId y a veces sin metricName real, se identifican por (contractNumber, materialId).
 */
export class LicenseWithContractAndManualMetricNameSpecification extends Criteria {
  private constructor(contractId: string, metricName: string) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('contractId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(contractId)
        ),
        new Filter(
          FilterField.create('metricName'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(metricName)
        ),
        new Filter(FilterField.create('source'), FilterOperator.create(Operator.EQUAL), FilterValue.create('MANUAL'))
      ])
    })
  }

  static of(contractId: string, metricName: string): LicenseWithContractAndManualMetricNameSpecification {
    return new LicenseWithContractAndManualMetricNameSpecification(contractId, metricName)
  }
}

export const withContractAndManualMetricName = LicenseWithContractAndManualMetricNameSpecification.of
