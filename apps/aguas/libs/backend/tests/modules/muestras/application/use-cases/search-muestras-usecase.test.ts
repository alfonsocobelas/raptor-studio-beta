import { SearchMuestrasUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/search-muestras-usecase.service'
import searchMuestraConfig from '../../../../../src/contexts/aguas/modules/muestras/application/config/search-muestra-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { MuestraMother } from '../../domain/mothers/muestra.mother'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('SearchMuestrasUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: SearchMuestrasUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new SearchMuestrasUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const muestras = MuestraMother.randomList(3)
    repositoryMock.givenMatching(muestras)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(muestras[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(MuestraMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchMuestraConfig.searchableFields)
  })
})
