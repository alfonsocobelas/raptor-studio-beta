import { v7 as uuidv7 } from 'uuid'
import { GetSupplierUseCase } from '../../../../../src/contexts/warehouse/modules/suppliers/application/use-cases/get-supplier-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { SupplierMother } from '../../domain/mothers/supplier.mother'
import { SupplierRepositoryMock } from '../../mocks/supplier.repository.mock'

describe('GetSupplierUseCase', () => {
  let repositoryMock: SupplierRepositoryMock
  let useCase: GetSupplierUseCase

  beforeEach(() => {
    repositoryMock = new SupplierRepositoryMock()
    useCase = new GetSupplierUseCase(repositoryMock)
  })

  describe('given the supplier exists', () => {
    it('returns its primitives', async () => {
      const supplier = SupplierMother.random()
      repositoryMock.givenFound(supplier)

      const result = await useCase.invoke({ id: supplier.id.value })

      expect(result).toEqual(supplier.toPrimitives())
    })
  })

  describe('given the supplier does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
