import { SearchVisitasUseCase } from '../../../../../src/contexts/fincaraiz/modules/visitas/application/use-cases/search-visitas-usecase.service'
import searchVisitaConfig from '../../../../../src/contexts/fincaraiz/modules/visitas/application/config/search-visita-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { VisitaMother } from '../../domain/mothers/visita.mother'
import { VisitaRepositoryMock } from '../../mocks/visita.repository.mock'

describe('SearchVisitasUseCase', () => {
  let repositoryMock: VisitaRepositoryMock
  let useCase: SearchVisitasUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new VisitaRepositoryMock()
    useCase = new SearchVisitasUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const visitas = VisitaMother.randomList(3)
    repositoryMock.givenMatching(visitas)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(visitas[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(VisitaMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchVisitaConfig.searchableFields)
  })
})
