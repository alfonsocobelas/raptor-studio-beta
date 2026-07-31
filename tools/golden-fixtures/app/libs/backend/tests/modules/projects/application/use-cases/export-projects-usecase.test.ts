import { ExportProjectsUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/export-projects-usecase.service'
import searchProjectConfig from '../../../../../src/contexts/sap-licensing/modules/projects/application/config/search-project-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('ExportProjectsUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: ExportProjectsUseCase

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new ExportProjectsUseCase(repositoryMock)
  })

  it('returns every matching project as primitives, without paginating', async () => {
    const projects = ProjectMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(projects)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(projects[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportProjectsUseCase(repositoryMock, 2)
    repositoryMock.givenCount(3)

    await expect(useCase.invoke({})).rejects.toBeInstanceOf(ExportTooLargeError)
    repositoryMock.assertNotCalled('matching')
  })

  it('builds the criteria with the search over the module searchable fields', async () => {
    repositoryMock.givenCount(0)
    repositoryMock.givenMatching([])

    await useCase.invoke({ search: 'anything' })

    const criteria = repositoryMock.matchingCriteria()
    expect(criteria.hasSearch()).toBe(true)
    expect(criteria.search?.fields).toEqual(searchProjectConfig.searchableFields)
  })
})
