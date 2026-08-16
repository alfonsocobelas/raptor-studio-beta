import { v7 as uuidv7 } from 'uuid'
import { GetPuntoUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/get-punto-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { PuntoMother } from '../../domain/mothers/punto.mother'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'

describe('GetPuntoUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: GetPuntoUseCase

  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    useCase = new GetPuntoUseCase(repositoryMock)
  })

  describe('given the punto exists', () => {
    it('returns its primitives', async () => {
      const punto = PuntoMother.random()
      repositoryMock.givenFound(punto)

      const result = await useCase.invoke({ id: punto.id.value })

      expect(result).toEqual(punto.toPrimitives())
    })
  })

  describe('given the punto does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
