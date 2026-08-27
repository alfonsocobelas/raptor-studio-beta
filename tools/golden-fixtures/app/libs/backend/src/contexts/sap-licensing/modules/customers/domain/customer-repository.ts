import { Nullable } from '../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { SapId } from './value-objects/sap-id.vo'
import { TaxId } from './value-objects/tax-id.vo'
import { Customer } from './customer'

export abstract class CustomerRepository {
  abstract register(customer: Customer): Promise<void>
  abstract save(customer: Customer): Promise<void>
  abstract get(customerId: CustomerId): Promise<Nullable<Customer>>
  abstract matching(criteria: Criteria): Promise<Customer[]>
  abstract findBySapId(sapId: SapId): Promise<Nullable<Customer>>
  abstract findByTaxId(taxId: TaxId): Promise<Nullable<Customer>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  /** Una agregación del conjunto filtrado (spec 71). `null` = no hay dato, que no es lo mismo que 0. */
  abstract aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null>
  /** El desglose de una agregación, en una sola consulta (spec 72). */
  abstract aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
