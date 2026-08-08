import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Visita } from '../../../../src/contexts/fincaraiz/modules/visitas/domain/visita'
import { VisitaRepository } from '../../../../src/contexts/fincaraiz/modules/visitas/domain/visita-repository'
import { VisitaId } from '../../../../src/contexts/shared/domain/value-objects/visitas/visita-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class VisitaRepositoryMock extends MockRepository<Visita> implements VisitaRepository {
  register(visita: Visita): Promise<void> {
    return this.getMock('register')(visita)
  }

  save(visita: Visita): Promise<void> {
    return this.getMock('save')(visita)
  }

  remove(visitaId: VisitaId): Promise<void> {
    return this.getMock('remove')(visitaId)
  }

  get(visitaId: VisitaId): Promise<Nullable<Visita>> {
    return this.getMock('get')(visitaId)
  }

  matching(criteria: Criteria): Promise<Visita[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(visita: Visita): void {
    this.setMockResult('get', visita)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(visitas: Visita[]): void {
    this.setMockResult('matching', visitas)
  }

  givenMatchingSequence(...results: Visita[][]): void {
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

  matchingCriteria(): Criteria {
    const calls = this.getMock('matching').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  countCriteria(): Criteria {
    const calls = this.getMock('count').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  registeredVisita(): Visita {
    return this.getMock('register').mock.calls[0][0] as Visita
  }

  savedVisita(): Visita {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Visita
  }
}
