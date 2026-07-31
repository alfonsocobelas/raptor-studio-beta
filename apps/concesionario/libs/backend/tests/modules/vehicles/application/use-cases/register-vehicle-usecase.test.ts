import { RegisterVehicleUseCase } from '../../../../../src/contexts/dealership/modules/vehicles/application/use-cases/register-vehicle-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { VehicleMother } from '../../domain/mothers/vehicle.mother'
import { VehicleRepositoryMock } from '../../mocks/vehicle.repository.mock'

describe('RegisterVehicleUseCase', () => {
  let repositoryMock: VehicleRepositoryMock
  let useCase: RegisterVehicleUseCase

  beforeEach(() => {
    repositoryMock = new VehicleRepositoryMock()
    useCase = new RegisterVehicleUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = VehicleMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 2)
      const registered = repositoryMock.registeredVehicle().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(VehicleMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
