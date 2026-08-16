import { SearchDeletedPuntosUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/search-deleted-puntos-usecase.service'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { PuntoMother } from '../../domain/mothers/punto.mother'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'

describe('SearchDeletedPuntosUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: SearchDeletedPuntosUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    useCase = new SearchDeletedPuntosUseCase(repositoryMock)
  })

  it('returns the deleted rows, paginated like the regular search', async () => {
    const puntos = PuntoMother.randomList(2)
    repositoryMock.givenDeleted(puntos)
    repositoryMock.givenDeletedCount(2)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual(puntos[0].toPrimitives())
  })
})
