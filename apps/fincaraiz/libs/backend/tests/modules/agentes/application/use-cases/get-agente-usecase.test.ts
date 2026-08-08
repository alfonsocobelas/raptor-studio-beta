import { v7 as uuidv7 } from 'uuid'
import { GetAgenteUseCase } from '../../../../../src/contexts/fincaraiz/modules/agentes/application/use-cases/get-agente-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { AgenteMother } from '../../domain/mothers/agente.mother'
import { AgenteRepositoryMock } from '../../mocks/agente.repository.mock'

describe('GetAgenteUseCase', () => {
  let repositoryMock: AgenteRepositoryMock
  let useCase: GetAgenteUseCase

  beforeEach(() => {
    repositoryMock = new AgenteRepositoryMock()
    useCase = new GetAgenteUseCase(repositoryMock)
  })

  describe('given the agente exists', () => {
    it('returns its primitives', async () => {
      const agente = AgenteMother.random()
      repositoryMock.givenFound(agente)

      const result = await useCase.invoke({ id: agente.id.value })

      expect(result).toEqual(agente.toPrimitives())
    })
  })

  describe('given the agente does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
