import { v7 as uuidv7 } from 'uuid'
import { UpdatePropiedadUseCase } from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/use-cases/update-propiedad-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { PropiedadMother } from '../../domain/mothers/propiedad.mother'
import { PropiedadRepositoryMock } from '../../mocks/propiedad.repository.mock'

describe('UpdatePropiedadUseCase', () => {
  let repositoryMock: PropiedadRepositoryMock
  let useCase: UpdatePropiedadUseCase

  beforeEach(() => {
    repositoryMock = new PropiedadRepositoryMock()
    useCase = new UpdatePropiedadUseCase(repositoryMock)
  })

  describe('given the propiedad does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(PropiedadMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
