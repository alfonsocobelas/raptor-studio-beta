import { SearchDeletedProjectsUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/search-deleted-projects-usecase.service'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('SearchDeletedProjectsUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: SearchDeletedProjectsUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new SearchDeletedProjectsUseCase(repositoryMock)
  })

  it('returns the deleted rows, paginated like the regular search', async () => {
    const projects = ProjectMother.randomList(2)
    repositoryMock.givenDeleted(projects)
    repositoryMock.givenDeletedCount(2)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual(projects[0].toPrimitives())
  })
})
