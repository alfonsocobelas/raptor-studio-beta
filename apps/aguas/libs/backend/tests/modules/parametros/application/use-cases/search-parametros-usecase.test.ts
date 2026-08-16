import { SearchParametrosUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/search-parametros-usecase.service'
import searchParametroConfig from '../../../../../src/contexts/aguas/modules/parametros/application/config/search-parametro-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ParametroMother } from '../../domain/mothers/parametro.mother'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('SearchParametrosUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: SearchParametrosUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new SearchParametrosUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const parametros = ParametroMother.randomList(3)
    repositoryMock.givenMatching(parametros)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(parametros[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(ParametroMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchParametroConfig.searchableFields)
  })
})
