import { SearchDeletedParametrosUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/search-deleted-parametros-usecase.service'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ParametroMother } from '../../domain/mothers/parametro.mother'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('SearchDeletedParametrosUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: SearchDeletedParametrosUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new SearchDeletedParametrosUseCase(repositoryMock)
  })

  it('returns the deleted rows, paginated like the regular search', async () => {
    const parametros = ParametroMother.randomList(2)
    repositoryMock.givenDeleted(parametros)
    repositoryMock.givenDeletedCount(2)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual(parametros[0].toPrimitives())
  })
})
