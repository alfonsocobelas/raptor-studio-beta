import { v7 as uuidv7 } from 'uuid'
import { RemoveAgenteUseCase } from '../../../../../src/contexts/fincaraiz/modules/agentes/application/use-cases/remove-agente-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { AgenteMother } from '../../domain/mothers/agente.mother'
import { AgenteRepositoryMock } from '../../mocks/agente.repository.mock'

describe('RemoveAgenteUseCase', () => {
  let repositoryMock: AgenteRepositoryMock
  let useCase: RemoveAgenteUseCase

  beforeEach(() => {
    repositoryMock = new AgenteRepositoryMock()
    useCase = new RemoveAgenteUseCase(repositoryMock)
  })

  describe('given the agente exists', () => {
    it('removes it', async () => {
      const agente = AgenteMother.random()
      repositoryMock.givenFound(agente)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: agente.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the agente does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
