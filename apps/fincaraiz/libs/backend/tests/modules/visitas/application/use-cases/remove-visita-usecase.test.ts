import { v7 as uuidv7 } from 'uuid'
import { RemoveVisitaUseCase } from '../../../../../src/contexts/fincaraiz/modules/visitas/application/use-cases/remove-visita-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { VisitaMother } from '../../domain/mothers/visita.mother'
import { VisitaRepositoryMock } from '../../mocks/visita.repository.mock'

describe('RemoveVisitaUseCase', () => {
  let repositoryMock: VisitaRepositoryMock
  let useCase: RemoveVisitaUseCase

  beforeEach(() => {
    repositoryMock = new VisitaRepositoryMock()
    useCase = new RemoveVisitaUseCase(repositoryMock)
  })

  describe('given the visita exists', () => {
    it('removes it', async () => {
      const visita = VisitaMother.random()
      repositoryMock.givenFound(visita)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: visita.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the visita does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
