import { SearchProjectsUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/search-projects-usecase.service'
import searchProjectConfig from '../../../../../src/contexts/sap-licensing/modules/projects/application/config/search-project-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('SearchProjectsUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: SearchProjectsUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new SearchProjectsUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const projects = ProjectMother.randomList(3)
    repositoryMock.givenMatching(projects)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(projects[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(ProjectMother.randomList(10))
    repositoryMock.givenCount(25)

    const result = await useCase.invoke({ page: 2, pageSize: 10 })

    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
  })

  it('builds the criteria with the search over the module searchable fields', async () => {
    repositoryMock.givenMatching([])
    repositoryMock.givenCount(0)

    await useCase.invoke({ ...baseInput, search: 'anything' })

    const criteria = repositoryMock.matchingCriteria()
    expect(criteria.hasSearch()).toBe(true)
    expect(criteria.search?.fields).toEqual(searchProjectConfig.searchableFields)
  })
})
