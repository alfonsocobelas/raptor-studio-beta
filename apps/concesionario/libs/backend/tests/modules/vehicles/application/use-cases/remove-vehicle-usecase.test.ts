import { v7 as uuidv7 } from 'uuid'
import { RemoveVehicleUseCase } from '../../../../../src/contexts/dealership/modules/vehicles/application/use-cases/remove-vehicle-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { VehicleMother } from '../../domain/mothers/vehicle.mother'
import { VehicleRepositoryMock } from '../../mocks/vehicle.repository.mock'

describe('RemoveVehicleUseCase', () => {
  let repositoryMock: VehicleRepositoryMock
  let useCase: RemoveVehicleUseCase

  beforeEach(() => {
    repositoryMock = new VehicleRepositoryMock()
    useCase = new RemoveVehicleUseCase(repositoryMock)
  })

  describe('given the vehicle exists', () => {
    it('removes it', async () => {
      const vehicle = VehicleMother.random()
      repositoryMock.givenFound(vehicle)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: vehicle.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the vehicle does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
