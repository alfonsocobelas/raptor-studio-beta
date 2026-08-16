import { v7 as uuidv7 } from 'uuid'
import { RemoveMuestraUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/remove-muestra-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { MuestraMother } from '../../domain/mothers/muestra.mother'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('RemoveMuestraUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: RemoveMuestraUseCase

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new RemoveMuestraUseCase(repositoryMock)
  })

  describe('given the muestra exists', () => {
    it('removes it', async () => {
      const muestra = MuestraMother.random()
      repositoryMock.givenFound(muestra)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: muestra.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the muestra does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
