import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ContractStatusValue } from '../value-objects/contract-status.vo'
import { ContractTypeValue } from '../value-objects/contract-type.vo'

// Cross-customer selector of currently-in-force cloud contracts, used by the QBR lazy
// generation to find which customers need a declaration this quarter. «Vigente» = active
// or expiring (an expiring contract is still in force), same semantics as the prototype.
const CLOUD: ContractTypeValue = 'cloud'
const ACTIVE_LIKE_STATUSES: readonly ContractStatusValue[] = ['active', 'expiring']

export class CloudActiveContractsSpecification extends Criteria {
  private constructor() {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('contractType'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(CLOUD)
        ),
        new Filter(
          FilterField.create('status'),
          FilterOperator.create(Operator.IN),
          FilterValue.create([...ACTIVE_LIKE_STATUSES])
        )
      ])
    })
  }

  static cloudActive(): CloudActiveContractsSpecification {
    return new CloudActiveContractsSpecification()
  }
}

export const cloudActiveContracts = CloudActiveContractsSpecification.cloudActive
