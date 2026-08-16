import { v7 as uuidv7 } from 'uuid'
import { RestoreMuestraUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/restore-muestra-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('RestoreMuestraUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: RestoreMuestraUseCase

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new RestoreMuestraUseCase(repositoryMock)
  })

  describe('given a soft-deleted muestra', () => {
    it('restores it', async () => {
      repositoryMock.whenRestoreSucceeds()

      await useCase.invoke({ id: uuidv7() })

      repositoryMock.assertCalled('restore')
    })
  })

  describe('given nothing deleted under that id', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.whenRestoreFindsNothing()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
