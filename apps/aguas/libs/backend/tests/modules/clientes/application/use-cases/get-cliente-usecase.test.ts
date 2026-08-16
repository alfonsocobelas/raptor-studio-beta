import { v7 as uuidv7 } from 'uuid'
import { GetClienteUseCase } from '../../../../../src/contexts/aguas/modules/clientes/application/use-cases/get-cliente-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ClienteMother } from '../../domain/mothers/cliente.mother'
import { ClienteRepositoryMock } from '../../mocks/cliente.repository.mock'

describe('GetClienteUseCase', () => {
  let repositoryMock: ClienteRepositoryMock
  let useCase: GetClienteUseCase

  beforeEach(() => {
    repositoryMock = new ClienteRepositoryMock()
    useCase = new GetClienteUseCase(repositoryMock)
  })

  describe('given the cliente exists', () => {
    it('returns its primitives', async () => {
      const cliente = ClienteMother.random()
      repositoryMock.givenFound(cliente)

      const result = await useCase.invoke({ id: cliente.id.value })

      expect(result).toEqual(cliente.toPrimitives())
    })
  })

  describe('given the cliente does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
