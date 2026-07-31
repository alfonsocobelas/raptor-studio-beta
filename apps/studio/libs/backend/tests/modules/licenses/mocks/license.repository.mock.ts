import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { License } from '../../../../src/contexts/sap-licensing/modules/licenses/domain/license'
import { LicenseRepository } from '../../../../src/contexts/sap-licensing/modules/licenses/domain/license-repository'
import { LicenseId } from '../../../../src/contexts/shared/domain/value-objects/licenses/license-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class LicenseRepositoryMock extends MockRepository<License> implements LicenseRepository {
  register(license: License): Promise<void> {
    return this.getMock('register')(license)
  }

  save(license: License): Promise<void> {
    return this.getMock('save')(license)
  }

  get(licenseId: LicenseId): Promise<Nullable<License>> {
    return this.getMock('get')(licenseId)
  }

  matching(criteria: Criteria): Promise<License[]> {
    return this.getMock('matching')(criteria)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(license: License): void {
    this.setMockResult('get', license)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(licenses: License[]): void {
    this.setMockResult('matching', licenses)
  }

  givenMatchingSequence(...results: License[][]): void {
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

  matchingCriteria(): Criteria {
    const calls = this.getMock('matching').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  countCriteria(): Criteria {
    const calls = this.getMock('count').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  registeredLicense(): License {
    return this.getMock('register').mock.calls[0][0] as License
  }

  savedLicense(): License {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as License
  }
}
