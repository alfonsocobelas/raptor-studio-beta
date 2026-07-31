import { v7 as uuidv7 } from 'uuid'
import { UpdateVehicleUseCase } from '../../../../../src/contexts/dealership/modules/vehicles/application/use-cases/update-vehicle-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { VehicleMother } from '../../domain/mothers/vehicle.mother'
import { VehicleRepositoryMock } from '../../mocks/vehicle.repository.mock'

describe('UpdateVehicleUseCase', () => {
  let repositoryMock: VehicleRepositoryMock
  let useCase: UpdateVehicleUseCase

  beforeEach(() => {
    repositoryMock = new VehicleRepositoryMock()
    useCase = new UpdateVehicleUseCase(repositoryMock)
  })

  describe('given the vehicle does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(VehicleMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given vin changes', () => {
    it('re-validates uniqueness and saves when the new value is free', async () => {
      const current = VehicleMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenSaveSuccess()

      // los valores de la mother son aleatorios: uno nuevo difiere del actual
      await useCase.invoke({ id: current.id.value, updates: { vin: VehicleMother.primitives().vin } })

      repositoryMock.assertCalledTimes('exists', 1)
      repositoryMock.assertCalled('save')
    })

    it('throws AlreadyExistsError and does not save when the new value is taken', async () => {
      repositoryMock.givenFound(VehicleMother.reconstruct())
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke({ id: uuidv7(), updates: { vin: VehicleMother.primitives().vin } })).rejects.toThrow(
        AlreadyExistsError
      )
      repositoryMock.assertNotCalled('save')
    })

    it('saves without checking uniqueness when the provided value is unchanged', async () => {
      const current = VehicleMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, updates: { vin: current.toPrimitives().vin } })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given plate changes', () => {
    it('re-validates uniqueness and saves when the new value is free', async () => {
      const current = VehicleMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenSaveSuccess()

      // los valores de la mother son aleatorios: uno nuevo difiere del actual
      await useCase.invoke({ id: current.id.value, updates: { plate: VehicleMother.primitives().plate } })

      repositoryMock.assertCalledTimes('exists', 1)
      repositoryMock.assertCalled('save')
    })

    it('throws AlreadyExistsError and does not save when the new value is taken', async () => {
      repositoryMock.givenFound(VehicleMother.reconstruct())
      repositoryMock.givenAlreadyExists()

      await expect(
        useCase.invoke({ id: uuidv7(), updates: { plate: VehicleMother.primitives().plate } })
      ).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('save')
    })

    it('saves without checking uniqueness when the provided value is unchanged', async () => {
      const current = VehicleMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, updates: { plate: current.toPrimitives().plate } })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
