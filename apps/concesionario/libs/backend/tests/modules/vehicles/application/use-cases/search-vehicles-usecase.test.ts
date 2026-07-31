import { SearchVehiclesUseCase } from '../../../../../src/contexts/dealership/modules/vehicles/application/use-cases/search-vehicles-usecase.service'
import searchVehicleConfig from '../../../../../src/contexts/dealership/modules/vehicles/application/config/search-vehicle-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { VehicleMother } from '../../domain/mothers/vehicle.mother'
import { VehicleRepositoryMock } from '../../mocks/vehicle.repository.mock'

describe('SearchVehiclesUseCase', () => {
  let repositoryMock: VehicleRepositoryMock
  let useCase: SearchVehiclesUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new VehicleRepositoryMock()
    useCase = new SearchVehiclesUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const vehicles = VehicleMother.randomList(3)
    repositoryMock.givenMatching(vehicles)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(vehicles[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(VehicleMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchVehicleConfig.searchableFields)
  })
})
