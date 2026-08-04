import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { TaxId } from '../value-objects/tax-id.vo'

export class CustomerWithTaxIdSpecification extends Criteria {
  private constructor(taxId: TaxId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('taxId'), FilterOperator.create(Operator.EQUAL), FilterValue.create(taxId.value))
      ])
    })
  }

  static withTaxId(taxId: TaxId): CustomerWithTaxIdSpecification {
    return new CustomerWithTaxIdSpecification(taxId)
  }
}

export const withTaxId = CustomerWithTaxIdSpecification.withTaxId
