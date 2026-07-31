import { RegisterContractUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/register-contract-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { ContractMother } from '../../domain/mothers/contract.mother'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

describe('RegisterContractUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: RegisterContractUseCase

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    useCase = new RegisterContractUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = ContractMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredContract().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(ContractMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
