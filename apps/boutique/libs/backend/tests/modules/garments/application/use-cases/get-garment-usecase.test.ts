import { v7 as uuidv7 } from 'uuid'
import { GetGarmentUseCase } from '../../../../../src/contexts/warehouse/modules/garments/application/use-cases/get-garment-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { GarmentMother } from '../../domain/mothers/garment.mother'
import { GarmentRepositoryMock } from '../../mocks/garment.repository.mock'

describe('GetGarmentUseCase', () => {
  let repositoryMock: GarmentRepositoryMock
  let useCase: GetGarmentUseCase

  beforeEach(() => {
    repositoryMock = new GarmentRepositoryMock()
    useCase = new GetGarmentUseCase(repositoryMock)
  })

  describe('given the garment exists', () => {
    it('returns its primitives', async () => {
      const garment = GarmentMother.random()
      repositoryMock.givenFound(garment)

      const result = await useCase.invoke({ id: garment.id.value })

      expect(result).toEqual(garment.toPrimitives())
    })
  })

  describe('given the garment does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
