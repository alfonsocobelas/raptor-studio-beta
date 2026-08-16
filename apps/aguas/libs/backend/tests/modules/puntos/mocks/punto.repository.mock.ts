import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Punto } from '../../../../src/contexts/aguas/modules/puntos/domain/punto'
import { PuntoRepository } from '../../../../src/contexts/aguas/modules/puntos/domain/punto-repository'
import { PuntoId } from '../../../../src/contexts/shared/domain/value-objects/puntos/punto-id.vo'
import { DeleteOperationId } from '../../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class PuntoRepositoryMock extends MockRepository<Punto> implements PuntoRepository {
  register(punto: Punto): Promise<void> {
    return this.getMock('register')(punto)
  }

  save(punto: Punto): Promise<void> {
    return this.getMock('save')(punto)
  }

  remove(puntoId: PuntoId, op: DeleteOperationId): Promise<void> {
    return this.getMock('remove')(puntoId, op)
  }

  get(puntoId: PuntoId): Promise<Nullable<Punto>> {
    return this.getMock('get')(puntoId)
  }

  matching(criteria: Criteria): Promise<Punto[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  matchingDeleted(criteria: Criteria): Promise<Punto[]> {
    return this.getMock('matchingDeleted')(criteria)
  }

  countDeleted(criteria: Criteria): Promise<number> {
    return this.getMock('countDeleted')(criteria)
  }

  restore(puntoId: PuntoId): Promise<boolean> {
    return this.getMock('restore')(puntoId)
  }

  removeDraggedByClienteId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    return this.getMock('removeDraggedByClienteId')(parentIds, op)
  }

  restoreByOp(op: DeleteOperationId): Promise<number> {
    return this.getMock('restoreByOp')(op)
  }

  deletedOpOf(puntoId: PuntoId): Promise<Nullable<DeleteOperationId>> {
    return this.getMock('deletedOpOf')(puntoId)
  }

  givenDeletedOp(op: Nullable<DeleteOperationId>): void {
    this.setMockResult('deletedOpOf', op)
  }

  whenRestoreByOpSucceeds(): void {
    this.setMockResult('restoreByOp', 1)
  }

  // helpers
  givenFound(punto: Punto): void {
    this.setMockResult('get', punto)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(puntos: Punto[]): void {
    this.setMockResult('matching', puntos)
  }

  givenMatchingSequence(...results: Punto[][]): void {
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

  givenDeleted(puntos: Punto[]): void {
    this.setMockResult('matchingDeleted', puntos)
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

  registeredPunto(): Punto {
    return this.getMock('register').mock.calls[0][0] as Punto
  }

  savedPunto(): Punto {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Punto
  }
}
