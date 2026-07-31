import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ClientTaxId } from '../value-objects/client-tax-id.vo'

export class ClientWithTaxIdSpecification extends Criteria {
  private constructor(taxId: ClientTaxId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('taxId'), FilterOperator.create(Operator.EQUAL), FilterValue.create(taxId.value))
      ])
    })
  }

  static withTaxId(taxId: ClientTaxId): ClientWithTaxIdSpecification {
    return new ClientWithTaxIdSpecification(taxId)
  }
}

export const withTaxId = ClientWithTaxIdSpecification.withTaxId
