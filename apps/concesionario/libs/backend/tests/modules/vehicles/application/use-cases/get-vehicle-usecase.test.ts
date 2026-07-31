import { v7 as uuidv7 } from 'uuid'
import { GetVehicleUseCase } from '../../../../../src/contexts/dealership/modules/vehicles/application/use-cases/get-vehicle-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { VehicleMother } from '../../domain/mothers/vehicle.mother'
import { VehicleRepositoryMock } from '../../mocks/vehicle.repository.mock'

describe('GetVehicleUseCase', () => {
  let repositoryMock: VehicleRepositoryMock
  let useCase: GetVehicleUseCase

  beforeEach(() => {
    repositoryMock = new VehicleRepositoryMock()
    useCase = new GetVehicleUseCase(repositoryMock)
  })

  describe('given the vehicle exists', () => {
    it('returns its primitives', async () => {
      const vehicle = VehicleMother.random()
      repositoryMock.givenFound(vehicle)

      const result = await useCase.invoke({ id: vehicle.id.value })

      expect(result).toEqual(vehicle.toPrimitives())
    })
  })

  describe('given the vehicle does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
