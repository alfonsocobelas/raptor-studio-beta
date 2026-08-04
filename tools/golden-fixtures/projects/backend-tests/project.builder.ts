import { v7 as uuidv7 } from 'uuid'
import { Project } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project'
import { ProjectPrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project-types'
import { ProjectDescription } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-description.vo'
import { ProjectImplementer } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-implementer.vo'
import { ProjectName } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-name.vo'
import { ProjectStatus } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-status.vo'
import { SapProjectId } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/sap-project-id.vo'
import { ContractDate } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-date.vo'
import { CustomerName } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/period.vo'
import { ProjectId } from '../../../../../src/contexts/shared/domain/value-objects/projects/project-id.vo'
import { CustomerId } from '../../../../../src/contexts/shared/domain/value-objects/customers/customer-id.vo'

const randomName = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class ProjectBuilder {
  private props: ProjectPrimitiveProps = {
    id: uuidv7(),
    customerId: uuidv7(),
    customerName: 'CustomerName 1',
    name: randomName(),
    description: '',
    startDate: '2026-01-15',
    endDate: '2027-01-14',
    status: 'planning',
    implementer: 'AVVALE',
    origin: 'MANUAL',
    lifecycleStatus: 'active',
    archivedAt: null,
    lastSeenInSyncAt: null,
    sapProjectId: null,
    atRisk: null,
    inEscalation: null,
    nbrOfWaves: null,
    waveStage: null,
    waveStatus: null,
    planToGoLive: null
  }

  static aProject(): ProjectBuilder {
    return new ProjectBuilder()
  }

  withId(id: string): ProjectBuilder {
    this.props.id = id
    return this
  }

  withCustomerId(customerId: string): ProjectBuilder {
    this.props.customerId = customerId
    return this
  }

  withName(name: string): ProjectBuilder {
    this.props.name = name
    return this
  }

  withStatus(status: string): ProjectBuilder {
    this.props.status = status
    return this
  }

  withImplementer(implementer: string): ProjectBuilder {
    this.props.implementer = implementer
    return this
  }

  withOrigin(origin: string): ProjectBuilder {
    this.props.origin = origin
    return this
  }

  withLifecycleStatus(lifecycleStatus: string): ProjectBuilder {
    this.props.lifecycleStatus = lifecycleStatus
    return this
  }

  withProps(overrides?: Partial<ProjectPrimitiveProps>): ProjectBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Project {
    return Project.create({
      id: ProjectId.create(this.props.id),
      customerId: CustomerId.create(this.props.customerId),
      customerName: CustomerName.create(this.props.customerName),
      name: ProjectName.create(this.props.name),
      description: ProjectDescription.create(this.props.description),
      status: ProjectStatus.create(this.props.status),
      implementer: ProjectImplementer.create(this.props.implementer),
      sapProjectId: this.props.sapProjectId != null ? SapProjectId.create(this.props.sapProjectId) : null,
      atRisk: this.props.atRisk ?? null,
      inEscalation: this.props.inEscalation ?? null,
      nbrOfWaves: this.props.nbrOfWaves ?? null,
      waveStage: this.props.waveStage ?? null,
      waveStatus: this.props.waveStatus ?? null,
      planToGoLive: this.props.planToGoLive
        ? ContractDate.create(new Date(this.props.planToGoLive))
        : ContractDate.unset(),
      period: Period.create(
        this.props.startDate ? ContractDate.create(new Date(this.props.startDate)) : null,
        this.props.endDate ? ContractDate.create(new Date(this.props.endDate)) : null
      )
    })
  }

  build(): Project {
    return Project.fromPrimitives(this.props)
  }
}
