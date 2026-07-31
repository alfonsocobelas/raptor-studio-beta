import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { LicenseId } from '../../../../../shared/domain/value-objects/licenses/license-id.vo'

export class LicenseWithIdSpecification extends Criteria {
  private constructor(id: LicenseId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: LicenseId): LicenseWithIdSpecification {
    return new LicenseWithIdSpecification(id)
  }
}

export const withLicenseId = LicenseWithIdSpecification.withId
