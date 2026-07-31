import { ExportGarmentsUseCase } from '../../../../../src/contexts/warehouse/modules/garments/application/use-cases/export-garments-usecase.service'
import searchGarmentConfig from '../../../../../src/contexts/warehouse/modules/garments/application/config/search-garment-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { GarmentMother } from '../../domain/mothers/garment.mother'
import { GarmentRepositoryMock } from '../../mocks/garment.repository.mock'

describe('ExportGarmentsUseCase', () => {
  let repositoryMock: GarmentRepositoryMock
  let useCase: ExportGarmentsUseCase

  beforeEach(() => {
    repositoryMock = new GarmentRepositoryMock()
    useCase = new ExportGarmentsUseCase(repositoryMock)
  })

  it('returns every matching garment as primitives, without paginating', async () => {
    const garments = GarmentMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(garments)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(garments[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportGarmentsUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchGarmentConfig.searchableFields)
  })
})
