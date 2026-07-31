import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Garment } from '../../../../src/contexts/warehouse/modules/garments/domain/garment'
import { GarmentRepository } from '../../../../src/contexts/warehouse/modules/garments/domain/garment-repository'
import { Sku } from '../../../../src/contexts/warehouse/modules/garments/domain/value-objects/sku.vo'
import { GarmentId } from '../../../../src/contexts/shared/domain/value-objects/garments/garment-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class GarmentRepositoryMock extends MockRepository<Garment> implements GarmentRepository {
  register(garment: Garment): Promise<void> {
    return this.getMock('register')(garment)
  }

  save(garment: Garment): Promise<void> {
    return this.getMock('save')(garment)
  }

  remove(garmentId: GarmentId): Promise<void> {
    return this.getMock('remove')(garmentId)
  }

  get(garmentId: GarmentId): Promise<Nullable<Garment>> {
    return this.getMock('get')(garmentId)
  }

  matching(criteria: Criteria): Promise<Garment[]> {
    return this.getMock('matching')(criteria)
  }

  findBySku(sku: Sku): Promise<Nullable<Garment>> {
    return this.getMock('findBySku')(sku)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(garment: Garment): void {
    this.setMockResult('get', garment)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(garments: Garment[]): void {
    this.setMockResult('matching', garments)
  }

  givenMatchingSequence(...results: Garment[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenBySku(garment: Nullable<Garment>): void {
    this.setMockResult('findBySku', garment)
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

  registeredGarment(): Garment {
    return this.getMock('register').mock.calls[0][0] as Garment
  }

  savedGarment(): Garment {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Garment
  }
}
