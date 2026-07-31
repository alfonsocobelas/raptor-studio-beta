import { v7 as uuidv7 } from 'uuid'
import { UpdateSupplierUseCase } from '../../../../../src/contexts/warehouse/modules/suppliers/application/use-cases/update-supplier-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { SupplierMother } from '../../domain/mothers/supplier.mother'
import { SupplierRepositoryMock } from '../../mocks/supplier.repository.mock'

describe('UpdateSupplierUseCase', () => {
  let repositoryMock: SupplierRepositoryMock
  let useCase: UpdateSupplierUseCase

  beforeEach(() => {
    repositoryMock = new SupplierRepositoryMock()
    useCase = new UpdateSupplierUseCase(repositoryMock)
  })

  describe('given the supplier does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(SupplierMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given taxId changes', () => {
    it('re-validates uniqueness and saves when the new value is free', async () => {
      const current = SupplierMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenSaveSuccess()

      // los valores de la mother son aleatorios: uno nuevo difiere del actual
      await useCase.invoke({ id: current.id.value, updates: { taxId: SupplierMother.primitives().taxId } })

      repositoryMock.assertCalledTimes('exists', 1)
      repositoryMock.assertCalled('save')
    })

    it('throws AlreadyExistsError and does not save when the new value is taken', async () => {
      repositoryMock.givenFound(SupplierMother.reconstruct())
      repositoryMock.givenAlreadyExists()

      await expect(
        useCase.invoke({ id: uuidv7(), updates: { taxId: SupplierMother.primitives().taxId } })
      ).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('save')
    })

    it('saves without checking uniqueness when the provided value is unchanged', async () => {
      const current = SupplierMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, updates: { taxId: current.toPrimitives().taxId } })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
