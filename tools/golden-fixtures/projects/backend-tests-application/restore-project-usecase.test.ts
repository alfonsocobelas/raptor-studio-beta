import { AuditTrailPort } from '../../../../../src/contexts/shared/domain/audit/audit-trail.port'
import { v7 as uuidv7 } from 'uuid'
import { RestoreProjectUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/restore-project-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('RestoreProjectUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: RestoreProjectUseCase
  const auditTrail = { record: jest.fn(), of: jest.fn() } as unknown as AuditTrailPort

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new RestoreProjectUseCase(repositoryMock, auditTrail)
  })

  describe('given a soft-deleted project', () => {
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
