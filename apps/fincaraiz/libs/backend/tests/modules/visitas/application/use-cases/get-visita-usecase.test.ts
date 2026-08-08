import { v7 as uuidv7 } from 'uuid'
import { GetVisitaUseCase } from '../../../../../src/contexts/fincaraiz/modules/visitas/application/use-cases/get-visita-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { VisitaMother } from '../../domain/mothers/visita.mother'
import { VisitaRepositoryMock } from '../../mocks/visita.repository.mock'

describe('GetVisitaUseCase', () => {
  let repositoryMock: VisitaRepositoryMock
  let useCase: GetVisitaUseCase

  beforeEach(() => {
    repositoryMock = new VisitaRepositoryMock()
    useCase = new GetVisitaUseCase(repositoryMock)
  })

  describe('given the visita exists', () => {
    it('returns its primitives', async () => {
      const visita = VisitaMother.random()
      repositoryMock.givenFound(visita)

      const result = await useCase.invoke({ id: visita.id.value })

      expect(result).toEqual(visita.toPrimitives())
    })
  })

  describe('given the visita does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
