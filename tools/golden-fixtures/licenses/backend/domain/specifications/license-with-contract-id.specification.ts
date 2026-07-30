import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ContractId } from '../../../../../shared/domain/value-objects/contracts/contract-id.vo'

export class LicenseWithContractIdSpecification extends Criteria {
  private constructor(contractId: ContractId) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('contractId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(contractId.value)
        )
      ])
    })
  }

  static withContractId(contractId: ContractId): LicenseWithContractIdSpecification {
    return new LicenseWithContractIdSpecification(contractId)
  }
}

export const withContractId = LicenseWithContractIdSpecification.withContractId
