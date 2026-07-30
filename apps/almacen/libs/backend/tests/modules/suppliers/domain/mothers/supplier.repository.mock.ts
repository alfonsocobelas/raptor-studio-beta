import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Supplier } from '../../../../src/contexts/warehouse/modules/suppliers/domain/supplier'
import { SupplierRepository } from '../../../../src/contexts/warehouse/modules/suppliers/domain/supplier-repository'
import { SupplierTaxId } from '../../../../src/contexts/warehouse/shared/domain/value-objects/supplier-tax-id.vo'
import { SupplierId } from '../../../../src/contexts/shared/domain/value-objects/suppliers/supplier-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class SupplierRepositoryMock extends MockRepository<Supplier> implements SupplierRepository {
  register(supplier: Supplier): Promise<void> {
    return this.getMock('register')(supplier)
  }

  save(supplier: Supplier): Promise<void> {
    return this.getMock('save')(supplier)
  }

  get(supplierId: SupplierId): Promise<Nullable<Supplier>> {
    return this.getMock('get')(supplierId)
  }

  matching(criteria: Criteria): Promise<Supplier[]> {
    return this.getMock('matching')(criteria)
  }

  findByTaxId(taxId: SupplierTaxId): Promise<Nullable<Supplier>> {
    return this.getMock('findByTaxId')(taxId)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(supplier: Supplier): void {
    this.setMockResult('get', supplier)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(suppliers: Supplier[]): void {
    this.setMockResult('matching', suppliers)
  }

  givenMatchingSequence(...results: Supplier[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenByTaxId(supplier: Nullable<Supplier>): void {
    this.setMockResult('findByTaxId', supplier)
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

  registeredSupplier(): Supplier {
    return this.getMock('register').mock.calls[0][0] as Supplier
  }

  savedSupplier(): Supplier {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Supplier
  }
}
