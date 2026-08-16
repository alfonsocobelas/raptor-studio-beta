import { v7 as uuidv7 } from 'uuid'
import { RemoveParametroUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/remove-parametro-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ParametroMother } from '../../domain/mothers/parametro.mother'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('RemoveParametroUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: RemoveParametroUseCase

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new RemoveParametroUseCase(repositoryMock)
  })

  describe('given the parametro exists', () => {
    it('removes it', async () => {
      const parametro = ParametroMother.random()
      repositoryMock.givenFound(parametro)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: parametro.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the parametro does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
