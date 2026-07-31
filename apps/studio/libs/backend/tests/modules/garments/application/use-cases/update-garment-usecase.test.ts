import { v7 as uuidv7 } from 'uuid'
import { UpdateGarmentUseCase } from '../../../../../src/contexts/warehouse/modules/garments/application/use-cases/update-garment-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { GarmentMother } from '../../domain/mothers/garment.mother'
import { GarmentRepositoryMock } from '../../mocks/garment.repository.mock'

describe('UpdateGarmentUseCase', () => {
  let repositoryMock: GarmentRepositoryMock
  let useCase: UpdateGarmentUseCase

  beforeEach(() => {
    repositoryMock = new GarmentRepositoryMock()
    useCase = new UpdateGarmentUseCase(repositoryMock)
  })

  describe('given the garment does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(GarmentMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given sku changes', () => {
    it('re-validates uniqueness and saves when the new value is free', async () => {
      const current = GarmentMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenSaveSuccess()

      // los valores de la mother son aleatorios: uno nuevo difiere del actual
      await useCase.invoke({ id: current.id.value, updates: { sku: GarmentMother.primitives().sku } })

      repositoryMock.assertCalledTimes('exists', 1)
      repositoryMock.assertCalled('save')
    })

    it('throws AlreadyExistsError and does not save when the new value is taken', async () => {
      repositoryMock.givenFound(GarmentMother.reconstruct())
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke({ id: uuidv7(), updates: { sku: GarmentMother.primitives().sku } })).rejects.toThrow(
        AlreadyExistsError
      )
      repositoryMock.assertNotCalled('save')
    })

    it('saves without checking uniqueness when the provided value is unchanged', async () => {
      const current = GarmentMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, updates: { sku: current.toPrimitives().sku } })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
