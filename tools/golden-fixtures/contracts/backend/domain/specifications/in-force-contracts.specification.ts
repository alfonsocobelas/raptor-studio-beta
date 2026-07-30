import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ContractStatusValue } from '../value-objects/contract-status.vo'

// «Vigente» = active o expiring (un contrato por expirar sigue en vigor), misma semántica que
// cloudActiveContracts pero sin filtrar por tipo. Lo usa SyncLicensesPhase (spec 44) para acotar
// las filas de ContractsRedesign a contratos presentes en BD antes del fetch N+1 de materiales.
const IN_FORCE_STATUSES: readonly ContractStatusValue[] = ['active', 'expiring']

export class InForceContractsSpecification extends Criteria {
  private constructor() {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('status'),
          FilterOperator.create(Operator.IN),
          FilterValue.create([...IN_FORCE_STATUSES])
        )
      ])
    })
  }

  static inForce(): InForceContractsSpecification {
    return new InForceContractsSpecification()
  }
}

export const inForceContracts = InForceContractsSpecification.inForce
