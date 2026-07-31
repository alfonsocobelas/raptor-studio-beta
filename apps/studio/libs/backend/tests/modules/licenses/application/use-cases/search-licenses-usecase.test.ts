import { SearchLicensesUseCase } from '../../../../../src/contexts/sap-licensing/modules/licenses/application/use-cases/search-licenses-usecase.service'
import searchLicenseConfig from '../../../../../src/contexts/sap-licensing/modules/licenses/application/config/search-license-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { LicenseMother } from '../../domain/mothers/license.mother'
import { LicenseRepositoryMock } from '../../mocks/license.repository.mock'

describe('SearchLicensesUseCase', () => {
  let repositoryMock: LicenseRepositoryMock
  let useCase: SearchLicensesUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new LicenseRepositoryMock()
    useCase = new SearchLicensesUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const licenses = LicenseMother.randomList(3)
    repositoryMock.givenMatching(licenses)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(licenses[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(LicenseMother.randomList(10))
    repositoryMock.givenCount(25)

    const result = await useCase.invoke({ page: 2, pageSize: 10 })

    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
  })

  it('builds the criteria with the search over the module searchable fields', async () => {
    repositoryMock.givenMatching([])
    repositoryMock.givenCount(0)

    await useCase.invoke({ ...baseInput, search: 'anything' })

    const criteria = repositoryMock.matchingCriteria()
    expect(criteria.hasSearch()).toBe(true)
    expect(criteria.search?.fields).toEqual(searchLicenseConfig.searchableFields)
  })
})
