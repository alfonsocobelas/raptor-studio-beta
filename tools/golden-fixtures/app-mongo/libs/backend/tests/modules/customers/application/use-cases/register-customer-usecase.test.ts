import { RegisterCustomerUseCase } from '../../../../../src/contexts/sap-licensing/modules/customers/application/use-cases/register-customer-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { CustomerMother } from '../../domain/mothers/customer.mother'
import { CustomerRepositoryMock } from '../../mocks/customer.repository.mock'

describe('RegisterCustomerUseCase', () => {
  let repositoryMock: CustomerRepositoryMock
  let useCase: RegisterCustomerUseCase

  beforeEach(() => {
    repositoryMock = new CustomerRepositoryMock()
    useCase = new RegisterCustomerUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = CustomerMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 2)
      const registered = repositoryMock.registeredCustomer().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given the optional unique fields are empty', () => {
    it('skips their uniqueness checks (ifPresent semantics)', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = CustomerMother.primitives({ taxId: '' })
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredCustomer().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(CustomerMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
