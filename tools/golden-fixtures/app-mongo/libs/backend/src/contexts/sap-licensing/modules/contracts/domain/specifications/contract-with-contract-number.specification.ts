import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ContractNumber } from '../../../../shared/domain/value-objects/contract-number.vo'

export class ContractWithContractNumberSpecification extends Criteria {
  private constructor(contractNumber: ContractNumber) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('contractNumber'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(contractNumber.value)
        )
      ])
    })
  }

  static withContractNumber(contractNumber: ContractNumber): ContractWithContractNumberSpecification {
    return new ContractWithContractNumberSpecification(contractNumber)
  }
}

export const withContractNumber = ContractWithContractNumberSpecification.withContractNumber
