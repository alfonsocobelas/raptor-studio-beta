import { ExportLicensesUseCase } from '../../../../../src/contexts/sap-licensing/modules/licenses/application/use-cases/export-licenses-usecase.service'
import searchLicenseConfig from '../../../../../src/contexts/sap-licensing/modules/licenses/application/config/search-license-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { LicenseMother } from '../../domain/mothers/license.mother'
import { LicenseRepositoryMock } from '../../mocks/license.repository.mock'

describe('ExportLicensesUseCase', () => {
  let repositoryMock: LicenseRepositoryMock
  let useCase: ExportLicensesUseCase

  beforeEach(() => {
    repositoryMock = new LicenseRepositoryMock()
    useCase = new ExportLicensesUseCase(repositoryMock)
  })

  it('returns every matching license as primitives, without paginating', async () => {
    const licenses = LicenseMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(licenses)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(licenses[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportLicensesUseCase(repositoryMock, 2)
    repositoryMock.givenCount(3)

    await expect(useCase.invoke({})).rejects.toBeInstanceOf(ExportTooLargeError)
    repositoryMock.assertNotCalled('matching')
  })

  it('builds the criteria with the search over the module searchable fields', async () => {
    repositoryMock.givenCount(0)
    repositoryMock.givenMatching([])

    await useCase.invoke({ search: 'anything' })

    const criteria = repositoryMock.matchingCriteria()
    expect(criteria.hasSearch()).toBe(true)
    expect(criteria.search?.fields).toEqual(searchLicenseConfig.searchableFields)
  })
})
