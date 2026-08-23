import { RegisterContractUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/register-contract-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { CustomerRepository } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer-repository'
import { ContractMother } from '../../domain/mothers/contract.mother'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

describe('RegisterContractUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: RegisterContractUseCase
  const customerRepository = { get: jest.fn() } as unknown as CustomerRepository

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    ;(customerRepository.get as jest.Mock).mockReset()
    ;(customerRepository.get as jest.Mock).mockResolvedValue({
      name: { value: ContractMother.primitives().customerName }
    })
    useCase = new RegisterContractUseCase(repositoryMock, customerRepository)
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

  describe('denormalización de customerName (spec 60)', () => {
    it('copia el valor canónico del origen, no el del input', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()
      const canonical = ContractMother.primitives().customerName
      ;(customerRepository.get as jest.Mock).mockResolvedValue({ name: { value: canonical } })

      const input = ContractMother.primitives()
      await useCase.invoke(input)

      const registered = repositoryMock.registeredContract().toPrimitives()
      expect(registered.customerName).toBe(canonical)
    })

    it('falla con EntityNotFoundError si el FK no apunta a ningún customer', async () => {
      ;(customerRepository.get as jest.Mock).mockResolvedValue(null)

      await expect(useCase.invoke(ContractMother.primitives())).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
