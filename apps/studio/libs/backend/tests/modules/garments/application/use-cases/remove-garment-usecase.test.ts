import { v7 as uuidv7 } from 'uuid'
import { RemoveGarmentUseCase } from '../../../../../src/contexts/warehouse/modules/garments/application/use-cases/remove-garment-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { GarmentMother } from '../../domain/mothers/garment.mother'
import { GarmentRepositoryMock } from '../../mocks/garment.repository.mock'

describe('RemoveGarmentUseCase', () => {
  let repositoryMock: GarmentRepositoryMock
  let useCase: RemoveGarmentUseCase

  beforeEach(() => {
    repositoryMock = new GarmentRepositoryMock()
    useCase = new RemoveGarmentUseCase(repositoryMock)
  })

  describe('given the garment exists', () => {
    it('removes it', async () => {
      const garment = GarmentMother.random()
      repositoryMock.givenFound(garment)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: garment.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the garment does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
