import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { AuditTrailPort } from '../../../../../shared/domain/audit/audit-trail.port'
import { Project } from '../../domain/project'
import { ProjectRepository } from '../../domain/project-repository'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { withName } from '../../domain/specifications/project-with-name.specification'
import { RegisterProjectInput } from '../dtos/register-project-input.dto'

@Injectable()
export class RegisterProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrail: AuditTrailPort,
    private readonly customerRepository: CustomerRepository
  ) {}

  async invoke(input: RegisterProjectInput): Promise<void> {
    // El valor desnormalizado se copia del canon, nunca del DTO (spec 60).
    const customer = await this.customerRepository.get(CustomerId.create(input.customerId))

    if (!customer) {
      throw new EntityNotFoundError('Customer', input.customerId)
    }

    const project = Project.register({ ...input, customerName: customer.name.value })
    const nameExists = await this.projectRepository.exists(withName(project.name))

    if (nameExists) {
      throw new AlreadyExistsError('Project', 'name', project.name.value)
    }

    await this.projectRepository.register(project)
    await this.auditTrail.record({
      entity: 'project',
      entityId: project.id.value,
      action: 'created',
      changes: {},
      actor: null
    })
  }
}
