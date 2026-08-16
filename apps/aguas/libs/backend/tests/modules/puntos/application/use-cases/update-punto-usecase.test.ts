import { v7 as uuidv7 } from 'uuid'
import { UpdatePuntoUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/update-punto-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { PuntoMother } from '../../domain/mothers/punto.mother'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'

describe('UpdatePuntoUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: UpdatePuntoUseCase

  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    useCase = new UpdatePuntoUseCase(repositoryMock)
  })

  describe('given the punto does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(PuntoMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
