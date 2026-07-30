import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Contract } from '../../../../src/contexts/sap-licensing/modules/contracts/domain/contract'
import { ContractRepository } from '../../../../src/contexts/sap-licensing/modules/contracts/domain/contract-repository'
import { ContractNumber } from '../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-number.vo'
import { ContractId } from '../../../../src/contexts/shared/domain/value-objects/contracts/contract-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class ContractRepositoryMock extends MockRepository<Contract> implements ContractRepository {
  register(contract: Contract): Promise<void> {
    return this.getMock('register')(contract)
  }

  save(contract: Contract): Promise<void> {
    return this.getMock('save')(contract)
  }

  get(contractId: ContractId): Promise<Nullable<Contract>> {
    return this.getMock('get')(contractId)
  }

  matching(criteria: Criteria): Promise<Contract[]> {
    return this.getMock('matching')(criteria)
  }

  findByContractNumber(contractNumber: ContractNumber): Promise<Nullable<Contract>> {
    return this.getMock('findByContractNumber')(contractNumber)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(contract: Contract): void {
    this.setMockResult('get', contract)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(contracts: Contract[]): void {
    this.setMockResult('matching', contracts)
  }

  givenMatchingSequence(...results: Contract[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenByContractNumber(contract: Nullable<Contract>): void {
    this.setMockResult('findByContractNumber', contract)
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

  registeredContract(): Contract {
    return this.getMock('register').mock.calls[0][0] as Contract
  }

  savedContract(): Contract {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Contract
  }
}
