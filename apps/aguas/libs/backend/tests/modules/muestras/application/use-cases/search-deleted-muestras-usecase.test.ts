import { SearchDeletedMuestrasUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/search-deleted-muestras-usecase.service'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { MuestraMother } from '../../domain/mothers/muestra.mother'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('SearchDeletedMuestrasUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: SearchDeletedMuestrasUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new SearchDeletedMuestrasUseCase(repositoryMock)
  })

  it('returns the deleted rows, paginated like the regular search', async () => {
    const muestras = MuestraMother.randomList(2)
    repositoryMock.givenDeleted(muestras)
    repositoryMock.givenDeletedCount(2)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual(muestras[0].toPrimitives())
  })
})
