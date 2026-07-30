import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'

/**
 * Licencias ME_SAP con lifecycle activo: candidatas a archivar por ausencia del material.
 * El filtro "vista en SAP" (lastSeenInSyncAt != null) se aplica en memoria en el servicio,
 * porque Criteria no expresa IS NOT NULL (mismo patrón que findArchivable de customers).
 */
export class ActiveMeSapLicensesSpecification extends Criteria {
  private constructor() {
    super({
      filters: new Filters([
        new Filter(FilterField.create('source'), FilterOperator.create(Operator.EQUAL), FilterValue.create('ME_SAP')),
        new Filter(
          FilterField.create('lifecycleStatus'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create('active')
        )
      ])
    })
  }

  static create(): ActiveMeSapLicensesSpecification {
    return new ActiveMeSapLicensesSpecification()
  }
}

export const activeMeSapLicenses = ActiveMeSapLicensesSpecification.create
