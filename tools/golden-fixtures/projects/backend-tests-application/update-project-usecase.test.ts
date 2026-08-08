import { AuditTrailPort } from '../../../../../src/contexts/shared/domain/audit/audit-trail.port'
import { v7 as uuidv7 } from 'uuid'
import { UpdateProjectUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/update-project-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('UpdateProjectUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: UpdateProjectUseCase
  const auditTrail = { record: jest.fn(), of: jest.fn() } as unknown as AuditTrailPort

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new UpdateProjectUseCase(repositoryMock, auditTrail)
  })

  describe('given the project does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(ProjectMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given name changes', () => {
    it('re-validates uniqueness and saves when the new value is free', async () => {
      const current = ProjectMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenSaveSuccess()

      // los valores de la mother son aleatorios: uno nuevo difiere del actual
      await useCase.invoke({ id: current.id.value, updates: { name: ProjectMother.primitives().name } })

      repositoryMock.assertCalledTimes('exists', 1)
      repositoryMock.assertCalled('save')
    })

    it('throws AlreadyExistsError and does not save when the new value is taken', async () => {
      repositoryMock.givenFound(ProjectMother.reconstruct())
      repositoryMock.givenAlreadyExists()

      await expect(
        useCase.invoke({ id: uuidv7(), updates: { name: ProjectMother.primitives().name } })
      ).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('save')
    })

    it('saves without checking uniqueness when the provided value is unchanged', async () => {
      const current = ProjectMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, updates: { name: current.toPrimitives().name } })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })
})
