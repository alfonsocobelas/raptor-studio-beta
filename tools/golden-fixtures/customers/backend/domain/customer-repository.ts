import { Nullable } from '../../../../shared/domain/types'
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
}
