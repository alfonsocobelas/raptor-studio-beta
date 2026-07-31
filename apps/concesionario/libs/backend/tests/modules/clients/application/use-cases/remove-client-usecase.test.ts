import { v7 as uuidv7 } from 'uuid'
import { RemoveClientUseCase } from '../../../../../src/contexts/dealership/modules/clients/application/use-cases/remove-client-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ClientMother } from '../../domain/mothers/client.mother'
import { ClientRepositoryMock } from '../../mocks/client.repository.mock'

describe('RemoveClientUseCase', () => {
  let repositoryMock: ClientRepositoryMock
  let useCase: RemoveClientUseCase

  beforeEach(() => {
    repositoryMock = new ClientRepositoryMock()
    useCase = new RemoveClientUseCase(repositoryMock)
  })

  describe('given the client exists', () => {
    it('removes it', async () => {
      const client = ClientMother.random()
      repositoryMock.givenFound(client)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: client.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the client does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
