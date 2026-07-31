import { RegisterSaleUseCase } from '../../../../../src/contexts/dealership/modules/sales/application/use-cases/register-sale-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { SaleMother } from '../../domain/mothers/sale.mother'
import { SaleRepositoryMock } from '../../mocks/sale.repository.mock'

describe('RegisterSaleUseCase', () => {
  let repositoryMock: SaleRepositoryMock
  let useCase: RegisterSaleUseCase

  beforeEach(() => {
    repositoryMock = new SaleRepositoryMock()
    useCase = new RegisterSaleUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = SaleMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredSale().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(SaleMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
