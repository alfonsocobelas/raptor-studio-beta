import { v7 as uuidv7 } from 'uuid'
import { RemoveMovementUseCase } from '../../../../../src/contexts/warehouse/modules/movements/application/use-cases/remove-movement-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { MovementMother } from '../../domain/mothers/movement.mother'
import { MovementRepositoryMock } from '../../mocks/movement.repository.mock'

describe('RemoveMovementUseCase', () => {
  let repositoryMock: MovementRepositoryMock
  let useCase: RemoveMovementUseCase

  beforeEach(() => {
    repositoryMock = new MovementRepositoryMock()
    useCase = new RemoveMovementUseCase(repositoryMock)
  })

  describe('given the movement exists', () => {
    it('removes it', async () => {
      const movement = MovementMother.random()
      repositoryMock.givenFound(movement)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: movement.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the movement does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
