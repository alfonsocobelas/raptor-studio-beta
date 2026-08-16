import { v7 as uuidv7 } from 'uuid'
import { RestoreParametroUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/restore-parametro-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('RestoreParametroUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: RestoreParametroUseCase

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new RestoreParametroUseCase(repositoryMock)
  })

  describe('given a soft-deleted parametro', () => {
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
