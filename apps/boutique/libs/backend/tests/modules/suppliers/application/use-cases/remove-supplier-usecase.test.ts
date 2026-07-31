import { v7 as uuidv7 } from 'uuid'
import { RemoveSupplierUseCase } from '../../../../../src/contexts/warehouse/modules/suppliers/application/use-cases/remove-supplier-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { SupplierMother } from '../../domain/mothers/supplier.mother'
import { SupplierRepositoryMock } from '../../mocks/supplier.repository.mock'

describe('RemoveSupplierUseCase', () => {
  let repositoryMock: SupplierRepositoryMock
  let useCase: RemoveSupplierUseCase

  beforeEach(() => {
    repositoryMock = new SupplierRepositoryMock()
    useCase = new RemoveSupplierUseCase(repositoryMock)
  })

  describe('given the supplier exists', () => {
    it('removes it', async () => {
      const supplier = SupplierMother.random()
      repositoryMock.givenFound(supplier)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: supplier.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the supplier does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
