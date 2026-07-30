import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { Customer } from './customer'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { SapId } from './value-objects/sap-id.vo'

export abstract class CustomerRepository {
  abstract register(customer: Customer): Promise<void>
  abstract save(customer: Customer): Promise<void>
  abstract get(customerId: CustomerId): Promise<Nullable<Customer>>
  abstract matching(criteria: Criteria): Promise<Customer[]>
  // Lookup por clave natural (unica en BD via uq_customers_sap_id): 0..1, nunca array
  abstract findBySapId(sapId: SapId): Promise<Nullable<Customer>>
  // Candidatos a archivado por el sync: activos con lastSeenInSyncAt != null
  abstract findArchivable(): Promise<Customer[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
}
