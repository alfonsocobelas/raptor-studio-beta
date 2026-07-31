import { SearchClientsUseCase } from '../../../../../src/contexts/dealership/modules/clients/application/use-cases/search-clients-usecase.service'
import searchClientConfig from '../../../../../src/contexts/dealership/modules/clients/application/config/search-client-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ClientMother } from '../../domain/mothers/client.mother'
import { ClientRepositoryMock } from '../../mocks/client.repository.mock'

describe('SearchClientsUseCase', () => {
  let repositoryMock: ClientRepositoryMock
  let useCase: SearchClientsUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ClientRepositoryMock()
    useCase = new SearchClientsUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const clients = ClientMother.randomList(3)
    repositoryMock.givenMatching(clients)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(clients[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(ClientMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchClientConfig.searchableFields)
  })
})
