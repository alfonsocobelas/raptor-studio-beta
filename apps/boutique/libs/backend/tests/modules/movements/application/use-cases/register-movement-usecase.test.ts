import { RegisterMovementUseCase } from '../../../../../src/contexts/warehouse/modules/movements/application/use-cases/register-movement-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { MovementMother } from '../../domain/mothers/movement.mother'
import { MovementRepositoryMock } from '../../mocks/movement.repository.mock'

describe('RegisterMovementUseCase', () => {
  let repositoryMock: MovementRepositoryMock
  let useCase: RegisterMovementUseCase

  beforeEach(() => {
    repositoryMock = new MovementRepositoryMock()
    useCase = new RegisterMovementUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = MovementMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredMovement().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(MovementMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
