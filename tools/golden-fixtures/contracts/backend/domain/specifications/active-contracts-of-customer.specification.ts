import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractStatusValue } from '../value-objects/contract-status.vo'

// «Activo» a efectos de negocio: en vigor. Un contrato expiring sigue vigente, solo está
// cerca de su fecha de fin (misma semántica que el prototipo).
const ACTIVE_LIKE_STATUSES: readonly ContractStatusValue[] = ['active', 'expiring']

export class ActiveContractsOfCustomerSpecification extends Criteria {
  private constructor(customerId: CustomerId) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('customerId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(customerId.value)
        ),
        new Filter(
          FilterField.create('status'),
          FilterOperator.create(Operator.IN),
          FilterValue.create([...ACTIVE_LIKE_STATUSES])
        )
      ])
    })
  }

  static ofCustomer(customerId: CustomerId): ActiveContractsOfCustomerSpecification {
    return new ActiveContractsOfCustomerSpecification(customerId)
  }
}

export const activeContractsOfCustomer = ActiveContractsOfCustomerSpecification.ofCustomer
