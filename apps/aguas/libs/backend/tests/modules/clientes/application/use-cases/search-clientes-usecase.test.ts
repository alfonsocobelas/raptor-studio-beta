import { SearchClientesUseCase } from '../../../../../src/contexts/aguas/modules/clientes/application/use-cases/search-clientes-usecase.service'
import searchClienteConfig from '../../../../../src/contexts/aguas/modules/clientes/application/config/search-cliente-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ClienteMother } from '../../domain/mothers/cliente.mother'
import { ClienteRepositoryMock } from '../../mocks/cliente.repository.mock'

describe('SearchClientesUseCase', () => {
  let repositoryMock: ClienteRepositoryMock
  let useCase: SearchClientesUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ClienteRepositoryMock()
    useCase = new SearchClientesUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const clientes = ClienteMother.randomList(3)
    repositoryMock.givenMatching(clientes)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(clientes[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(ClienteMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchClienteConfig.searchableFields)
  })
})
