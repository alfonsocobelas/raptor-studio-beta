import { v7 as uuidv7 } from 'uuid'
import { RemoveProjectUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/remove-project-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('RemoveProjectUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: RemoveProjectUseCase

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new RemoveProjectUseCase(repositoryMock)
  })

  describe('given the project exists', () => {
    it('removes it', async () => {
      const project = ProjectMother.random()
      repositoryMock.givenFound(project)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: project.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the project does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
