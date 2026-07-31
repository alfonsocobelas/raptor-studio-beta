import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Client } from '../../../../src/contexts/dealership/modules/clients/domain/client'
import { ClientRepository } from '../../../../src/contexts/dealership/modules/clients/domain/client-repository'
import { ClientTaxId } from '../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-tax-id.vo'
import { ClientId } from '../../../../src/contexts/shared/domain/value-objects/clients/client-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class ClientRepositoryMock extends MockRepository<Client> implements ClientRepository {
  register(client: Client): Promise<void> {
    return this.getMock('register')(client)
  }

  save(client: Client): Promise<void> {
    return this.getMock('save')(client)
  }

  remove(clientId: ClientId): Promise<void> {
    return this.getMock('remove')(clientId)
  }

  get(clientId: ClientId): Promise<Nullable<Client>> {
    return this.getMock('get')(clientId)
  }

  matching(criteria: Criteria): Promise<Client[]> {
    return this.getMock('matching')(criteria)
  }

  findByTaxId(taxId: ClientTaxId): Promise<Nullable<Client>> {
    return this.getMock('findByTaxId')(taxId)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(client: Client): void {
    this.setMockResult('get', client)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(clients: Client[]): void {
    this.setMockResult('matching', clients)
  }

  givenMatchingSequence(...results: Client[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenByTaxId(client: Nullable<Client>): void {
    this.setMockResult('findByTaxId', client)
  }

  givenAlreadyExists(): void {
    this.setMockResult('exists', true)
  }

  givenDoesNotExist(): void {
    this.setMockResult('exists', false)
  }

  givenExistsSequence(...results: boolean[]): void {
    const mock = this.getMock('exists')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenCount(count: number): void {
    this.setMockResult('count', count)
  }

  whenRegisterSuccess(): void {
    this.setMockResult('register', undefined)
  }

  whenSaveSuccess(): void {
    this.setMockResult('save', undefined)
  }

  whenRegisterFailsOnce(error: Error): void {
    this.getMock('register').mockRejectedValueOnce(error)
  }

  whenRemoveSuccess(): void {
    this.setMockResult('remove', undefined)
  }

  matchingCriteria(): Criteria {
    const calls = this.getMock('matching').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  countCriteria(): Criteria {
    const calls = this.getMock('count').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  registeredClient(): Client {
    return this.getMock('register').mock.calls[0][0] as Client
  }

  savedClient(): Client {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Client
  }
}
