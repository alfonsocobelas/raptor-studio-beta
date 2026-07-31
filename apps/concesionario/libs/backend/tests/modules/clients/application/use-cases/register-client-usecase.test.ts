import { RegisterClientUseCase } from '../../../../../src/contexts/dealership/modules/clients/application/use-cases/register-client-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { ClientMother } from '../../domain/mothers/client.mother'
import { ClientRepositoryMock } from '../../mocks/client.repository.mock'

describe('RegisterClientUseCase', () => {
  let repositoryMock: ClientRepositoryMock
  let useCase: RegisterClientUseCase

  beforeEach(() => {
    repositoryMock = new ClientRepositoryMock()
    useCase = new RegisterClientUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = ClientMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredClient().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(ClientMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
