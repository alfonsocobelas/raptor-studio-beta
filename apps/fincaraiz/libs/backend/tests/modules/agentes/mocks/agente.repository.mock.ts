import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Agente } from '../../../../src/contexts/fincaraiz/modules/agentes/domain/agente'
import { AgenteRepository } from '../../../../src/contexts/fincaraiz/modules/agentes/domain/agente-repository'
import { AgenteId } from '../../../../src/contexts/shared/domain/value-objects/agentes/agente-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class AgenteRepositoryMock extends MockRepository<Agente> implements AgenteRepository {
  register(agente: Agente): Promise<void> {
    return this.getMock('register')(agente)
  }

  save(agente: Agente): Promise<void> {
    return this.getMock('save')(agente)
  }

  remove(agenteId: AgenteId): Promise<void> {
    return this.getMock('remove')(agenteId)
  }

  get(agenteId: AgenteId): Promise<Nullable<Agente>> {
    return this.getMock('get')(agenteId)
  }

  matching(criteria: Criteria): Promise<Agente[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(agente: Agente): void {
    this.setMockResult('get', agente)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(agentes: Agente[]): void {
    this.setMockResult('matching', agentes)
  }

  givenMatchingSequence(...results: Agente[][]): void {
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

  registeredAgente(): Agente {
    return this.getMock('register').mock.calls[0][0] as Agente
  }

  savedAgente(): Agente {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Agente
  }
}
