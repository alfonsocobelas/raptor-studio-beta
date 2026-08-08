import { v7 as uuidv7 } from 'uuid'
import { GetPropiedadUseCase } from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/use-cases/get-propiedad-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { PropiedadMother } from '../../domain/mothers/propiedad.mother'
import { PropiedadRepositoryMock } from '../../mocks/propiedad.repository.mock'

describe('GetPropiedadUseCase', () => {
  let repositoryMock: PropiedadRepositoryMock
  let useCase: GetPropiedadUseCase

  beforeEach(() => {
    repositoryMock = new PropiedadRepositoryMock()
    useCase = new GetPropiedadUseCase(repositoryMock)
  })

  describe('given the propiedad exists', () => {
    it('returns its primitives', async () => {
      const propiedad = PropiedadMother.random()
      repositoryMock.givenFound(propiedad)

      const result = await useCase.invoke({ id: propiedad.id.value })

      expect(result).toEqual(propiedad.toPrimitives())
    })
  })

  describe('given the propiedad does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
