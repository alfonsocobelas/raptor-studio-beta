import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Sale } from '../../../../src/contexts/dealership/modules/sales/domain/sale'
import { SaleRepository } from '../../../../src/contexts/dealership/modules/sales/domain/sale-repository'
import { SaleReference } from '../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-reference.vo'
import { SaleId } from '../../../../src/contexts/shared/domain/value-objects/sales/sale-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class SaleRepositoryMock extends MockRepository<Sale> implements SaleRepository {
  register(sale: Sale): Promise<void> {
    return this.getMock('register')(sale)
  }

  save(sale: Sale): Promise<void> {
    return this.getMock('save')(sale)
  }

  remove(saleId: SaleId): Promise<void> {
    return this.getMock('remove')(saleId)
  }

  get(saleId: SaleId): Promise<Nullable<Sale>> {
    return this.getMock('get')(saleId)
  }

  matching(criteria: Criteria): Promise<Sale[]> {
    return this.getMock('matching')(criteria)
  }

  findByReference(reference: SaleReference): Promise<Nullable<Sale>> {
    return this.getMock('findByReference')(reference)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(sale: Sale): void {
    this.setMockResult('get', sale)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(sales: Sale[]): void {
    this.setMockResult('matching', sales)
  }

  givenMatchingSequence(...results: Sale[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenByReference(sale: Nullable<Sale>): void {
    this.setMockResult('findByReference', sale)
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

  registeredSale(): Sale {
    return this.getMock('register').mock.calls[0][0] as Sale
  }

  savedSale(): Sale {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Sale
  }
}
