import { AuditTrailPort } from '../../../../../src/contexts/shared/domain/audit/audit-trail.port'
import { RegisterProjectUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/register-project-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { CustomerRepository } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer-repository'
import { ProjectMother } from '../../domain/mothers/project.mother'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

describe('RegisterProjectUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: RegisterProjectUseCase
  const auditTrail = { record: jest.fn(), of: jest.fn() } as unknown as AuditTrailPort
  const customerRepository = { get: jest.fn() } as unknown as CustomerRepository

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    ;(customerRepository.get as jest.Mock).mockReset()
    ;(customerRepository.get as jest.Mock).mockResolvedValue({
      name: { value: ProjectMother.primitives().customerName }
    })
    useCase = new RegisterProjectUseCase(repositoryMock, auditTrail, customerRepository)
  })

  describe('given no duplicate exists', () => {
    it('checks each unique field once and registers', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()

      const input = ProjectMother.primitives()
      await useCase.invoke(input)

      repositoryMock.assertCalledTimes('exists', 1)
      const registered = repositoryMock.registeredProject().toPrimitives()
      expect(registered.id).toBe(input.id)
    })
  })

  describe('given a duplicate exists', () => {
    it('throws AlreadyExistsError and does not register', async () => {
      repositoryMock.givenAlreadyExists()

      await expect(useCase.invoke(ProjectMother.primitives())).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('register')
    })
  })

  describe('denormalización de customerName (spec 60)', () => {
    it('copia el valor canónico del origen, no el del input', async () => {
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenRegisterSuccess()
      const canonical = ProjectMother.primitives().customerName
      ;(customerRepository.get as jest.Mock).mockResolvedValue({ name: { value: canonical } })

      const input = ProjectMother.primitives()
      await useCase.invoke(input)

      const registered = repositoryMock.registeredProject().toPrimitives()
      expect(registered.customerName).toBe(canonical)
    })

    it('falla con EntityNotFoundError si el FK no apunta a ningún customer', async () => {
      ;(customerRepository.get as jest.Mock).mockResolvedValue(null)

      await expect(useCase.invoke(ProjectMother.primitives())).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('register')
    })
  })
})
