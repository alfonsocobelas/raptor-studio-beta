import { v7 as uuidv7 } from 'uuid'
import { GetProjectUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/get-project-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('GetProjectUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: GetProjectUseCase

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new GetProjectUseCase(repositoryMock)
  })

  describe('given the project exists', () => {
    it('returns its primitives', async () => {
      const project = ProjectMother.random()
      repositoryMock.givenFound(project)

      const result = await useCase.invoke({ id: project.id.value })

      expect(result).toEqual(project.toPrimitives())
    })
  })

  describe('given the project does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
