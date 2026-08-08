import { v7 as uuidv7 } from 'uuid'
import { UpdateAgenteUseCase } from '../../../../../src/contexts/fincaraiz/modules/agentes/application/use-cases/update-agente-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { AgenteMother } from '../../domain/mothers/agente.mother'
import { AgenteRepositoryMock } from '../../mocks/agente.repository.mock'

describe('UpdateAgenteUseCase', () => {
  let repositoryMock: AgenteRepositoryMock
  let useCase: UpdateAgenteUseCase

  beforeEach(() => {
    repositoryMock = new AgenteRepositoryMock()
    useCase = new UpdateAgenteUseCase(repositoryMock)
  })

  describe('given the agente does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(AgenteMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
