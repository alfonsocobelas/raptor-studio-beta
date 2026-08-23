import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { changesBetween } from '../../../../../shared/domain/audit/audit-changes'
import { AuditTrailPort } from '../../../../../shared/domain/audit/audit-trail.port'
import { ProjectRepository } from '../../domain/project-repository'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { withName } from '../../domain/specifications/project-with-name.specification'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { UpdateProjectInput } from '../dtos/update-project-input.dto'

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrail: AuditTrailPort,
    private readonly customerRepository: CustomerRepository
  ) {}

  async invoke(input: UpdateProjectInput): Promise<void> {
    const projectId = ProjectId.create(input.id)
    const project = await this.projectRepository.get(projectId)

    if (!project) {
      throw new EntityNotFoundError('Project', input.id)
    }

    const newName = project.newNameIfChanged(input.updates)

    if (newName) {
      const nameExists = await this.projectRepository.exists(withName(newName))

      if (nameExists) {
        throw new AlreadyExistsError('Project', 'name', newName.value)
      }
    }

    let updates = input.updates

    // La copia desnormalizada se refresca del canon cuando cambia el FK (spec 60).
    if (updates.customerId !== undefined) {
      const customer = await this.customerRepository.get(CustomerId.create(updates.customerId))

      if (!customer) {
        throw new EntityNotFoundError('Customer', updates.customerId)
      }

      updates = { ...updates, customerName: customer.name.value }
    }

    const before = project.toPrimitives()
    project.updateDetails(updates)
    await this.projectRepository.save(project)
    await this.auditTrail.record({
      entity: 'project',
      entityId: projectId.value,
      action: 'updated',
      changes: changesBetween(before, project.toPrimitives()),
      actor: null
    })
  }
}
