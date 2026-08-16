import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Muestra } from '../../../../src/contexts/aguas/modules/muestras/domain/muestra'
import { MuestraRepository } from '../../../../src/contexts/aguas/modules/muestras/domain/muestra-repository'
import { MuestraId } from '../../../../src/contexts/shared/domain/value-objects/muestras/muestra-id.vo'
import { DeleteOperationId } from '../../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class MuestraRepositoryMock extends MockRepository<Muestra> implements MuestraRepository {
  register(muestra: Muestra): Promise<void> {
    return this.getMock('register')(muestra)
  }

  save(muestra: Muestra): Promise<void> {
    return this.getMock('save')(muestra)
  }

  remove(muestraId: MuestraId, op: DeleteOperationId): Promise<void> {
    return this.getMock('remove')(muestraId, op)
  }

  get(muestraId: MuestraId): Promise<Nullable<Muestra>> {
    return this.getMock('get')(muestraId)
  }

  matching(criteria: Criteria): Promise<Muestra[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  matchingDeleted(criteria: Criteria): Promise<Muestra[]> {
    return this.getMock('matchingDeleted')(criteria)
  }

  countDeleted(criteria: Criteria): Promise<number> {
    return this.getMock('countDeleted')(criteria)
  }

  restore(muestraId: MuestraId): Promise<boolean> {
    return this.getMock('restore')(muestraId)
  }

  removeDraggedByPuntoId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    return this.getMock('removeDraggedByPuntoId')(parentIds, op)
  }

  restoreByOp(op: DeleteOperationId): Promise<number> {
    return this.getMock('restoreByOp')(op)
  }

  // helpers
  givenFound(muestra: Muestra): void {
    this.setMockResult('get', muestra)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(muestras: Muestra[]): void {
    this.setMockResult('matching', muestras)
  }

  givenMatchingSequence(...results: Muestra[][]): void {
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

  givenDeleted(muestras: Muestra[]): void {
    this.setMockResult('matchingDeleted', muestras)
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

  registeredMuestra(): Muestra {
    return this.getMock('register').mock.calls[0][0] as Muestra
  }

  savedMuestra(): Muestra {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Muestra
  }
}
