import { SearchMovementsUseCase } from '../../../../../src/contexts/warehouse/modules/movements/application/use-cases/search-movements-usecase.service'
import searchMovementConfig from '../../../../../src/contexts/warehouse/modules/movements/application/config/search-movement-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { MovementMother } from '../../domain/mothers/movement.mother'
import { MovementRepositoryMock } from '../../mocks/movement.repository.mock'

describe('SearchMovementsUseCase', () => {
  let repositoryMock: MovementRepositoryMock
  let useCase: SearchMovementsUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new MovementRepositoryMock()
    useCase = new SearchMovementsUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const movements = MovementMother.randomList(3)
    repositoryMock.givenMatching(movements)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(movements[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(MovementMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchMovementConfig.searchableFields)
  })
})
