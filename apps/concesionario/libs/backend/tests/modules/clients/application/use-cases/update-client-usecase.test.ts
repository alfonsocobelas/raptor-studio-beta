import { v7 as uuidv7 } from 'uuid'
import { UpdateClientUseCase } from '../../../../../src/contexts/dealership/modules/clients/application/use-cases/update-client-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ClientMother } from '../../domain/mothers/client.mother'
import { ClientRepositoryMock } from '../../mocks/client.repository.mock'

describe('UpdateClientUseCase', () => {
  let repositoryMock: ClientRepositoryMock
  let useCase: UpdateClientUseCase

  beforeEach(() => {
    repositoryMock = new ClientRepositoryMock()
    useCase = new UpdateClientUseCase(repositoryMock)
  })

  describe('given the client does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(ClientMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given taxId changes', () => {
    it('re-validates uniqueness and saves when the new value is free', async () => {
      const current = ClientMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenSaveSuccess()

      // los valores de la mother son aleatorios: uno nuevo difiere del actual
      await useCase.invoke({ id: current.id.value, updates: { taxId: ClientMother.primitives().taxId } })

      repositoryMock.assertCalledTimes('exists', 1)
      repositoryMock.assertCalled('save')
    })

    it('throws AlreadyExistsError and does not save when the new value is taken', async () => {
      repositoryMock.givenFound(ClientMother.reconstruct())
      repositoryMock.givenAlreadyExists()

      await expect(
        useCase.invoke({ id: uuidv7(), updates: { taxId: ClientMother.primitives().taxId } })
      ).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('save')
    })

    it('saves without checking uniqueness when the provided value is unchanged', async () => {
      const current = ClientMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, updates: { taxId: current.toPrimitives().taxId } })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
