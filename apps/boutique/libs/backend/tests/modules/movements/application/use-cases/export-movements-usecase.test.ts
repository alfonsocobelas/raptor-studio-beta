import { ExportMovementsUseCase } from '../../../../../src/contexts/warehouse/modules/movements/application/use-cases/export-movements-usecase.service'
import searchMovementConfig from '../../../../../src/contexts/warehouse/modules/movements/application/config/search-movement-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { MovementMother } from '../../domain/mothers/movement.mother'
import { MovementRepositoryMock } from '../../mocks/movement.repository.mock'

describe('ExportMovementsUseCase', () => {
  let repositoryMock: MovementRepositoryMock
  let useCase: ExportMovementsUseCase

  beforeEach(() => {
    repositoryMock = new MovementRepositoryMock()
    useCase = new ExportMovementsUseCase(repositoryMock)
  })

  it('returns every matching movement as primitives, without paginating', async () => {
    const movements = MovementMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(movements)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(movements[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportMovementsUseCase(repositoryMock, 2)
    repositoryMock.givenCount(3)

    await expect(useCase.invoke({})).rejects.toBeInstanceOf(ExportTooLargeError)
    repositoryMock.assertNotCalled('matching')
  })

  it('builds the criteria with the search over the module searchable fields', async () => {
    repositoryMock.givenCount(0)
    repositoryMock.givenMatching([])

    await useCase.invoke({ search: 'anything' })

    const criteria = repositoryMock.matchingCriteria()
    expect(criteria.hasSearch()).toBe(true)
    expect(criteria.search?.fields).toEqual(searchMovementConfig.searchableFields)
  })
})
