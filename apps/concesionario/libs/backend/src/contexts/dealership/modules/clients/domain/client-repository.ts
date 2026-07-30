import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { ClientId } from '../../../../shared/domain/value-objects/clients/client-id.vo'
import { ClientTaxId } from './value-objects/client-tax-id.vo'
import { Client } from './client'

export abstract class ClientRepository {
  abstract register(client: Client): Promise<void>
  abstract save(client: Client): Promise<void>
  abstract remove(clientId: ClientId): Promise<void>
  abstract get(clientId: ClientId): Promise<Nullable<Client>>
  abstract matching(criteria: Criteria): Promise<Client[]>
  abstract findByTaxId(taxId: ClientTaxId): Promise<Nullable<Client>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
