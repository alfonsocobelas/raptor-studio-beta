import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Customer } from '../../../../src/contexts/sap-licensing/modules/customers/domain/customer'
import { CustomerRepository } from '../../../../src/contexts/sap-licensing/modules/customers/domain/customer-repository'
import { SapId } from '../../../../src/contexts/sap-licensing/shared/domain/value-objects/sap-id.vo'
import { TaxId } from '../../../../src/contexts/sap-licensing/shared/domain/value-objects/tax-id.vo'
import { CustomerId } from '../../../../src/contexts/shared/domain/value-objects/customers/customer-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class CustomerRepositoryMock extends MockRepository<Customer> implements CustomerRepository {
  register(customer: Customer): Promise<void> {
    return this.getMock('register')(customer)
  }

  save(customer: Customer): Promise<void> {
    return this.getMock('save')(customer)
  }

  get(customerId: CustomerId): Promise<Nullable<Customer>> {
    return this.getMock('get')(customerId)
  }

  matching(criteria: Criteria): Promise<Customer[]> {
    return this.getMock('matching')(criteria)
  }

  findBySapId(sapId: SapId): Promise<Nullable<Customer>> {
    return this.getMock('findBySapId')(sapId)
  }

  findByTaxId(taxId: TaxId): Promise<Nullable<Customer>> {
    return this.getMock('findByTaxId')(taxId)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(customer: Customer): void {
    this.setMockResult('get', customer)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(customers: Customer[]): void {
    this.setMockResult('matching', customers)
  }

  givenMatchingSequence(...results: Customer[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenBySapId(customer: Nullable<Customer>): void {
    this.setMockResult('findBySapId', customer)
  }

  givenByTaxId(customer: Nullable<Customer>): void {
    this.setMockResult('findByTaxId', customer)
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

  registeredCustomer(): Customer {
    return this.getMock('register').mock.calls[0][0] as Customer
  }

  savedCustomer(): Customer {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Customer
  }
}
