import { ExportVehiclesUseCase } from '../../../../../src/contexts/dealership/modules/vehicles/application/use-cases/export-vehicles-usecase.service'
import searchVehicleConfig from '../../../../../src/contexts/dealership/modules/vehicles/application/config/search-vehicle-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { VehicleMother } from '../../domain/mothers/vehicle.mother'
import { VehicleRepositoryMock } from '../../mocks/vehicle.repository.mock'

describe('ExportVehiclesUseCase', () => {
  let repositoryMock: VehicleRepositoryMock
  let useCase: ExportVehiclesUseCase

  beforeEach(() => {
    repositoryMock = new VehicleRepositoryMock()
    useCase = new ExportVehiclesUseCase(repositoryMock)
  })

  it('returns every matching vehicle as primitives, without paginating', async () => {
    const vehicles = VehicleMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(vehicles)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(vehicles[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportVehiclesUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchVehicleConfig.searchableFields)
  })
})
