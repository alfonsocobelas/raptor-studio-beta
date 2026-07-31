import { v7 as uuidv7 } from 'uuid'
import { GetMovementUseCase } from '../../../../../src/contexts/warehouse/modules/movements/application/use-cases/get-movement-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { MovementMother } from '../../domain/mothers/movement.mother'
import { MovementRepositoryMock } from '../../mocks/movement.repository.mock'

describe('GetMovementUseCase', () => {
  let repositoryMock: MovementRepositoryMock
  let useCase: GetMovementUseCase

  beforeEach(() => {
    repositoryMock = new MovementRepositoryMock()
    useCase = new GetMovementUseCase(repositoryMock)
  })

  describe('given the movement exists', () => {
    it('returns its primitives', async () => {
      const movement = MovementMother.random()
      repositoryMock.givenFound(movement)

      const result = await useCase.invoke({ id: movement.id.value })

      expect(result).toEqual(movement.toPrimitives())
    })
  })

  describe('given the movement does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
