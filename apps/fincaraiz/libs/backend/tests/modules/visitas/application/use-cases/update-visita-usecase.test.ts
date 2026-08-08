import { v7 as uuidv7 } from 'uuid'
import { UpdateVisitaUseCase } from '../../../../../src/contexts/fincaraiz/modules/visitas/application/use-cases/update-visita-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { VisitaMother } from '../../domain/mothers/visita.mother'
import { VisitaRepositoryMock } from '../../mocks/visita.repository.mock'

describe('UpdateVisitaUseCase', () => {
  let repositoryMock: VisitaRepositoryMock
  let useCase: UpdateVisitaUseCase

  beforeEach(() => {
    repositoryMock = new VisitaRepositoryMock()
    useCase = new UpdateVisitaUseCase(repositoryMock)
  })

  describe('given the visita does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(VisitaMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
