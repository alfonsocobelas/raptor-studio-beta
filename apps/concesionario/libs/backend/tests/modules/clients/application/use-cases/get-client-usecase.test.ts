import { v7 as uuidv7 } from 'uuid'
import { GetClientUseCase } from '../../../../../src/contexts/dealership/modules/clients/application/use-cases/get-client-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ClientMother } from '../../domain/mothers/client.mother'
import { ClientRepositoryMock } from '../../mocks/client.repository.mock'

describe('GetClientUseCase', () => {
  let repositoryMock: ClientRepositoryMock
  let useCase: GetClientUseCase

  beforeEach(() => {
    repositoryMock = new ClientRepositoryMock()
    useCase = new GetClientUseCase(repositoryMock)
  })

  describe('given the client exists', () => {
    it('returns its primitives', async () => {
      const client = ClientMother.random()
      repositoryMock.givenFound(client)

      const result = await useCase.invoke({ id: client.id.value })

      expect(result).toEqual(client.toPrimitives())
    })
  })

  describe('given the client does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
