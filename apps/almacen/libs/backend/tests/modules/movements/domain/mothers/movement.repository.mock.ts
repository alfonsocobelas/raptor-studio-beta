import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Movement } from '../../../../src/contexts/warehouse/modules/movements/domain/movement'
import { MovementRepository } from '../../../../src/contexts/warehouse/modules/movements/domain/movement-repository'
import { MovementReference } from '../../../../src/contexts/warehouse/shared/domain/value-objects/movement-reference.vo'
import { MovementId } from '../../../../src/contexts/shared/domain/value-objects/movements/movement-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class MovementRepositoryMock extends MockRepository<Movement> implements MovementRepository {
  register(movement: Movement): Promise<void> {
    return this.getMock('register')(movement)
  }

  save(movement: Movement): Promise<void> {
    return this.getMock('save')(movement)
  }

  get(movementId: MovementId): Promise<Nullable<Movement>> {
    return this.getMock('get')(movementId)
  }

  matching(criteria: Criteria): Promise<Movement[]> {
    return this.getMock('matching')(criteria)
  }

  findByReference(reference: MovementReference): Promise<Nullable<Movement>> {
    return this.getMock('findByReference')(reference)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(movement: Movement): void {
    this.setMockResult('get', movement)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(movements: Movement[]): void {
    this.setMockResult('matching', movements)
  }

  givenMatchingSequence(...results: Movement[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenByReference(movement: Nullable<Movement>): void {
    this.setMockResult('findByReference', movement)
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

  matchingCriteria(): Criteria {
    const calls = this.getMock('matching').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  countCriteria(): Criteria {
    const calls = this.getMock('count').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  registeredMovement(): Movement {
    return this.getMock('register').mock.calls[0][0] as Movement
  }

  savedMovement(): Movement {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Movement
  }
}
