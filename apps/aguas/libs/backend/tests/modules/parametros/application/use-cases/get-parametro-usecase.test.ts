import { v7 as uuidv7 } from 'uuid'
import { GetParametroUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/get-parametro-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ParametroMother } from '../../domain/mothers/parametro.mother'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('GetParametroUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: GetParametroUseCase

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new GetParametroUseCase(repositoryMock)
  })

  describe('given the parametro exists', () => {
    it('returns its primitives', async () => {
      const parametro = ParametroMother.random()
      repositoryMock.givenFound(parametro)

      const result = await useCase.invoke({ id: parametro.id.value })

      expect(result).toEqual(parametro.toPrimitives())
    })
  })

  describe('given the parametro does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
