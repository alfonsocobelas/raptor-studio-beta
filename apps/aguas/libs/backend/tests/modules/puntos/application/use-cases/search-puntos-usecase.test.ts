import { SearchPuntosUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/search-puntos-usecase.service'
import searchPuntoConfig from '../../../../../src/contexts/aguas/modules/puntos/application/config/search-punto-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { PuntoMother } from '../../domain/mothers/punto.mother'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'

describe('SearchPuntosUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: SearchPuntosUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    useCase = new SearchPuntosUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const puntos = PuntoMother.randomList(3)
    repositoryMock.givenMatching(puntos)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(puntos[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(PuntoMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchPuntoConfig.searchableFields)
  })
})
