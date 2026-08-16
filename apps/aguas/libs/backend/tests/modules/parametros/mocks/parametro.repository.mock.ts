import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Parametro } from '../../../../src/contexts/aguas/modules/parametros/domain/parametro'
import { ParametroRepository } from '../../../../src/contexts/aguas/modules/parametros/domain/parametro-repository'
import { ParametroId } from '../../../../src/contexts/shared/domain/value-objects/parametros/parametro-id.vo'
import { DeleteOperationId } from '../../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class ParametroRepositoryMock extends MockRepository<Parametro> implements ParametroRepository {
  register(parametro: Parametro): Promise<void> {
    return this.getMock('register')(parametro)
  }

  save(parametro: Parametro): Promise<void> {
    return this.getMock('save')(parametro)
  }

  remove(parametroId: ParametroId, op: DeleteOperationId): Promise<void> {
    return this.getMock('remove')(parametroId, op)
  }

  get(parametroId: ParametroId): Promise<Nullable<Parametro>> {
    return this.getMock('get')(parametroId)
  }

  matching(criteria: Criteria): Promise<Parametro[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  matchingDeleted(criteria: Criteria): Promise<Parametro[]> {
    return this.getMock('matchingDeleted')(criteria)
  }

  countDeleted(criteria: Criteria): Promise<number> {
    return this.getMock('countDeleted')(criteria)
  }

  restore(parametroId: ParametroId): Promise<boolean> {
    return this.getMock('restore')(parametroId)
  }

  restoreByOp(op: DeleteOperationId): Promise<number> {
    return this.getMock('restoreByOp')(op)
  }

  // helpers
  givenFound(parametro: Parametro): void {
    this.setMockResult('get', parametro)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(parametros: Parametro[]): void {
    this.setMockResult('matching', parametros)
  }

  givenMatchingSequence(...results: Parametro[][]): void {
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

  givenDeleted(parametros: Parametro[]): void {
    this.setMockResult('matchingDeleted', parametros)
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

  registeredParametro(): Parametro {
    return this.getMock('register').mock.calls[0][0] as Parametro
  }

  savedParametro(): Parametro {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Parametro
  }
}
