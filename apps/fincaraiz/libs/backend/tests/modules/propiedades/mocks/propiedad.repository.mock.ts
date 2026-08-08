import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Propiedad } from '../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad'
import { PropiedadRepository } from '../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad-repository'
import { PropiedadId } from '../../../../src/contexts/shared/domain/value-objects/propiedades/propiedad-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class PropiedadRepositoryMock extends MockRepository<Propiedad> implements PropiedadRepository {
  register(propiedad: Propiedad): Promise<void> {
    return this.getMock('register')(propiedad)
  }

  save(propiedad: Propiedad): Promise<void> {
    return this.getMock('save')(propiedad)
  }

  remove(propiedadId: PropiedadId): Promise<void> {
    return this.getMock('remove')(propiedadId)
  }

  get(propiedadId: PropiedadId): Promise<Nullable<Propiedad>> {
    return this.getMock('get')(propiedadId)
  }

  matching(criteria: Criteria): Promise<Propiedad[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(propiedad: Propiedad): void {
    this.setMockResult('get', propiedad)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(propiedades: Propiedad[]): void {
    this.setMockResult('matching', propiedades)
  }

  givenMatchingSequence(...results: Propiedad[][]): void {
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

  registeredPropiedad(): Propiedad {
    return this.getMock('register').mock.calls[0][0] as Propiedad
  }

  savedPropiedad(): Propiedad {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Propiedad
  }
}
