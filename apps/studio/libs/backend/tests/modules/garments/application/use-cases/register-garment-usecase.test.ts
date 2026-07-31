import { RegisterGarmentUseCase } from '../../../../../src/contexts/warehouse/modules/garments/application/use-cases/register-garment-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { GarmentMother } from '../../domain/mothers/garment.mother'
import { GarmentRepositoryMock } from '../../mocks/garment.repository.mock'

describe('RegisterGarmentUseCase', () => {
  let repositoryMock: GarmentRepositoryMock
  let useCase: RegisterGarmentUseCase

  beforeEach(() => {
    repositoryMock = new GarmentRepositoryMock()
    useCase = new RegisterGarmentUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = GarmentMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredGarment().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(GarmentMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
