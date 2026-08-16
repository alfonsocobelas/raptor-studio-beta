import { v7 as uuidv7 } from 'uuid'
import { UpdateClienteUseCase } from '../../../../../src/contexts/aguas/modules/clientes/application/use-cases/update-cliente-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ClienteMother } from '../../domain/mothers/cliente.mother'
import { ClienteRepositoryMock } from '../../mocks/cliente.repository.mock'

describe('UpdateClienteUseCase', () => {
  let repositoryMock: ClienteRepositoryMock
  let useCase: UpdateClienteUseCase

  beforeEach(() => {
    repositoryMock = new ClienteRepositoryMock()
    useCase = new UpdateClienteUseCase(repositoryMock)
  })

  describe('given the cliente does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(ClienteMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
