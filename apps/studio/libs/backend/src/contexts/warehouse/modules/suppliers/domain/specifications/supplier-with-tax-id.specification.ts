import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { SupplierTaxId } from '../value-objects/supplier-tax-id.vo'

export class SupplierWithTaxIdSpecification extends Criteria {
  private constructor(taxId: SupplierTaxId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('taxId'), FilterOperator.create(Operator.EQUAL), FilterValue.create(taxId.value))
      ])
    })
  }

  static withTaxId(taxId: SupplierTaxId): SupplierWithTaxIdSpecification {
    return new SupplierWithTaxIdSpecification(taxId)
  }
}

export const withTaxId = SupplierWithTaxIdSpecification.withTaxId
