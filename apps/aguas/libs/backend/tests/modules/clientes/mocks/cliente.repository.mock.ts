import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Cliente } from '../../../../src/contexts/aguas/modules/clientes/domain/cliente'
import { ClienteRepository } from '../../../../src/contexts/aguas/modules/clientes/domain/cliente-repository'
import { ClienteId } from '../../../../src/contexts/shared/domain/value-objects/clientes/cliente-id.vo'
import { DeleteOperationId } from '../../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class ClienteRepositoryMock extends MockRepository<Cliente> implements ClienteRepository {
  register(cliente: Cliente): Promise<void> {
    return this.getMock('register')(cliente)
  }

  save(cliente: Cliente): Promise<void> {
    return this.getMock('save')(cliente)
  }

  remove(clienteId: ClienteId, op: DeleteOperationId): Promise<void> {
    return this.getMock('remove')(clienteId, op)
  }

  get(clienteId: ClienteId): Promise<Nullable<Cliente>> {
    return this.getMock('get')(clienteId)
  }

  matching(criteria: Criteria): Promise<Cliente[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  matchingDeleted(criteria: Criteria): Promise<Cliente[]> {
    return this.getMock('matchingDeleted')(criteria)
  }

  countDeleted(criteria: Criteria): Promise<number> {
    return this.getMock('countDeleted')(criteria)
  }

  restore(clienteId: ClienteId): Promise<boolean> {
    return this.getMock('restore')(clienteId)
  }

  restoreByOp(op: DeleteOperationId): Promise<number> {
    return this.getMock('restoreByOp')(op)
  }

  deletedOpOf(clienteId: ClienteId): Promise<Nullable<DeleteOperationId>> {
    return this.getMock('deletedOpOf')(clienteId)
  }

  givenDeletedOp(op: Nullable<DeleteOperationId>): void {
    this.setMockResult('deletedOpOf', op)
  }

  whenRestoreByOpSucceeds(): void {
    this.setMockResult('restoreByOp', 1)
  }

  // helpers
  givenFound(cliente: Cliente): void {
    this.setMockResult('get', cliente)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(clientes: Cliente[]): void {
    this.setMockResult('matching', clientes)
  }

  givenMatchingSequence(...results: Cliente[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
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

  givenDeleted(clientes: Cliente[]): void {
    this.setMockResult('matchingDeleted', clientes)
  }

  givenDeletedCount(count: number): void {
    this.setMockResult('countDeleted', count)
  }

  whenRestoreSucceeds(): void {
    this.setMockResult('restore', true)
  }

  whenRestoreFindsNothing(): void {
    this.setMockResult('restore', false)
  }

  matchingCriteria(): Criteria {
    const calls = this.getMock('matching').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  countCriteria(): Criteria {
    const calls = this.getMock('count').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  registeredCliente(): Cliente {
    return this.getMock('register').mock.calls[0][0] as Cliente
  }

  savedCliente(): Cliente {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Cliente
  }
}
