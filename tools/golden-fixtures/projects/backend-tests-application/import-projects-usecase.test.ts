import { AuditTrailPort } from '../../../../../src/contexts/shared/domain/audit/audit-trail.port'
import { TransactionManager } from '../../../../../src/contexts/shared/domain/persistence/transaction-manager'
import { ImportProjectsUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/import-projects-usecase.service'
import { RegisterProjectInput } from '../../../../../src/contexts/sap-licensing/modules/projects/application/dtos/register-project-input.dto'
import { RegisterProjectUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/register-project-usecase.service'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('ImportProjectsUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: ImportProjectsUseCase
  const auditTrail = { record: jest.fn(), of: jest.fn() } as unknown as AuditTrailPort
  const txManager = {
    runInTransaction: jest.fn(async (work: () => Promise<unknown>) => work())
  } as unknown as TransactionManager

  const row = (): RegisterProjectInput => ProjectMother.random().toPrimitives() as unknown as RegisterProjectInput

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    const register = new RegisterProjectUseCase(repositoryMock, auditTrail)
    useCase = new ImportProjectsUseCase(register, txManager)
  })

  it('una fila con error de dominio frena TODO el import y la señala', async () => {
    // una fila vacía viola los value objects del alta: mismo gate que el formulario
    const bad = {} as RegisterProjectInput

    const result = await useCase.invoke({ rows: [row(), bad] })

    expect(result.imported).toBe(0)
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0].row).toBe(2)
    repositoryMock.assertNotCalled('register')
  })

  it('con todas las filas limpias importa todas dentro de una transacción', async () => {
    repositoryMock.givenDoesNotExist()
    repositoryMock.whenRegisterSuccess()

    const result = await useCase.invoke({ rows: [row(), row()] })

    expect(result).toEqual({ imported: 2, failures: [] })
    expect(txManager.runInTransaction).toHaveBeenCalled()
  })
})
