import { SearchGarmentsUseCase } from '../../../../../src/contexts/warehouse/modules/garments/application/use-cases/search-garments-usecase.service'
import searchGarmentConfig from '../../../../../src/contexts/warehouse/modules/garments/application/config/search-garment-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { GarmentMother } from '../../domain/mothers/garment.mother'
import { GarmentRepositoryMock } from '../../mocks/garment.repository.mock'

describe('SearchGarmentsUseCase', () => {
  let repositoryMock: GarmentRepositoryMock
  let useCase: SearchGarmentsUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new GarmentRepositoryMock()
    useCase = new SearchGarmentsUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const garments = GarmentMother.randomList(3)
    repositoryMock.givenMatching(garments)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(garments[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(GarmentMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchGarmentConfig.searchableFields)
  })
})
