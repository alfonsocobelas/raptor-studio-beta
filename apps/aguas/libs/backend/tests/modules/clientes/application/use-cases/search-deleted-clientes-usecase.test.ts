import { SearchDeletedClientesUseCase } from '../../../../../src/contexts/aguas/modules/clientes/application/use-cases/search-deleted-clientes-usecase.service'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ClienteMother } from '../../domain/mothers/cliente.mother'
import { ClienteRepositoryMock } from '../../mocks/cliente.repository.mock'

describe('SearchDeletedClientesUseCase', () => {
  let repositoryMock: ClienteRepositoryMock
  let useCase: SearchDeletedClientesUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ClienteRepositoryMock()
    useCase = new SearchDeletedClientesUseCase(repositoryMock)
  })

  it('returns the deleted rows, paginated like the regular search', async () => {
    const clientes = ClienteMother.randomList(2)
    repositoryMock.givenDeleted(clientes)
    repositoryMock.givenDeletedCount(2)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual(clientes[0].toPrimitives())
  })
})
