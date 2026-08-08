import { v7 as uuidv7 } from 'uuid'
import { RemovePropiedadUseCase } from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/use-cases/remove-propiedad-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { PropiedadMother } from '../../domain/mothers/propiedad.mother'
import { PropiedadRepositoryMock } from '../../mocks/propiedad.repository.mock'

describe('RemovePropiedadUseCase', () => {
  let repositoryMock: PropiedadRepositoryMock
  let useCase: RemovePropiedadUseCase

  beforeEach(() => {
    repositoryMock = new PropiedadRepositoryMock()
    useCase = new RemovePropiedadUseCase(repositoryMock)
  })

  describe('given the propiedad exists', () => {
    it('removes it', async () => {
      const propiedad = PropiedadMother.random()
      repositoryMock.givenFound(propiedad)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: propiedad.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the propiedad does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
