import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Project } from '../../../../src/contexts/sap-licensing/modules/projects/domain/project'
import { ProjectRepository } from '../../../../src/contexts/sap-licensing/modules/projects/domain/project-repository'
import { ProjectName } from '../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-name.vo'
import { ProjectId } from '../../../../src/contexts/shared/domain/value-objects/projects/project-id.vo'
import { DeleteOperationId } from '../../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class ProjectRepositoryMock extends MockRepository<Project> implements ProjectRepository {
  register(project: Project): Promise<void> {
    return this.getMock('register')(project)
  }

  save(project: Project): Promise<void> {
    return this.getMock('save')(project)
  }

  remove(projectId: ProjectId, op: DeleteOperationId): Promise<void> {
    return this.getMock('remove')(projectId, op)
  }

  get(projectId: ProjectId): Promise<Nullable<Project>> {
    return this.getMock('get')(projectId)
  }

  matching(criteria: Criteria): Promise<Project[]> {
    return this.getMock('matching')(criteria)
  }

  findByName(name: ProjectName): Promise<Nullable<Project>> {
    return this.getMock('findByName')(name)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  removeDraggedByCustomerId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    return this.getMock('removeDraggedByCustomerId')(parentIds, op)
  }

  // helpers
  givenFound(project: Project): void {
    this.setMockResult('get', project)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(projects: Project[]): void {
    this.setMockResult('matching', projects)
  }

  givenMatchingSequence(...results: Project[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenByName(project: Nullable<Project>): void {
    this.setMockResult('findByName', project)
  }

  givenAlreadyExists(): void {
    this.setMockResult('exists', true)
  }

  givenDoesNotExist(): void {
    this.setMockResult('exists', false)
  }

  givenExistsSequence(...results: boolean[]): void {
    const mock = this.getMock('exists')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenCount(count: number): void {
    this.setMockResult('count', count)
  }

  whenRegisterSuccess(): void {
    this.setMockResult('register', undefined)
  }

  whenSaveSuccess(): void {
    this.setMockResult('save', undefined)
  }

  whenRegisterFailsOnce(error: Error): void {
    this.getMock('register').mockRejectedValueOnce(error)
  }

  whenRemoveSuccess(): void {
    this.setMockResult('remove', undefined)
  }

  matchingCriteria(): Criteria {
    const calls = this.getMock('matching').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  countCriteria(): Criteria {
    const calls = this.getMock('count').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  registeredProject(): Project {
    return this.getMock('register').mock.calls[0][0] as Project
  }

  savedProject(): Project {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Project
  }
}
