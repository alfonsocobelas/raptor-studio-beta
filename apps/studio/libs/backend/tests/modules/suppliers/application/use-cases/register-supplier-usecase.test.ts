import { RegisterSupplierUseCase } from '../../../../../src/contexts/warehouse/modules/suppliers/application/use-cases/register-supplier-usecase.service'
import { AlreadyExistsError } from '../../../../../src/contexts/shared/domain/errors'
import { SupplierMother } from '../../domain/mothers/supplier.mother'
import { SupplierRepositoryMock } from '../../mocks/supplier.repository.mock'

describe('RegisterSupplierUseCase', () => {
  let repositoryMock: SupplierRepositoryMock
  let useCase: RegisterSupplierUseCase

  beforeEach(() => {
    repositoryMock = new SupplierRepositoryMock()
    useCase = new RegisterSupplierUseCase(repositoryMock)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = SupplierMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredSupplier().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given the optional unique fields are empty', () => {
    it('skips their uniqueness checks (ifPresent semantics)', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = SupplierMother.primitives({ taxId: '' })
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 0)
      const registered = repositoryMock.registeredSupplier().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(SupplierMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
