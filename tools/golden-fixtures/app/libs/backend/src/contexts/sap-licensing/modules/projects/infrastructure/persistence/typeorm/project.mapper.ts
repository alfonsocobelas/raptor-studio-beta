import { Project } from '../../../domain/project'
import { TypeOrmProjectEntity } from './typeorm-project.entity'

export class ProjectMapper {
  static toDomain(entity: TypeOrmProjectEntity): Project {
    return Project.fromPrimitives({
      id: entity.id,
      customerId: entity.customerId,
      customerName: entity.customerName,
      name: entity.name,
      description: entity.description,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      implementer: entity.implementer,
      origin: entity.origin,
      lifecycleStatus: entity.lifecycleStatus,
      archivedAt: entity.archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: entity.lastSeenInSyncAt?.toISOString() ?? null,
      sapProjectId: entity.sapProjectId,
      atRisk: entity.atRisk,
      inEscalation: entity.inEscalation,
      nbrOfWaves: entity.nbrOfWaves,
      waveStage: entity.waveStage,
      waveStatus: entity.waveStatus,
      planToGoLive: entity.planToGoLive
    })
  }

  static toPersistence(domain: Project): TypeOrmProjectEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmProjectEntity()
    entity.id = primitives.id
    entity.customerId = primitives.customerId
    entity.customerName = primitives.customerName
    entity.name = primitives.name
    entity.description = primitives.description
    entity.startDate = primitives.startDate
    entity.endDate = primitives.endDate
    entity.status = primitives.status
    entity.implementer = primitives.implementer
    entity.origin = primitives.origin ?? 'MANUAL'
    entity.lifecycleStatus = primitives.lifecycleStatus ?? 'active'
    entity.archivedAt = primitives.archivedAt ? new Date(primitives.archivedAt) : null
    entity.lastSeenInSyncAt = primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null
    entity.sapProjectId = primitives.sapProjectId ?? null
    entity.atRisk = primitives.atRisk ?? null
    entity.inEscalation = primitives.inEscalation ?? null
    entity.nbrOfWaves = primitives.nbrOfWaves ?? null
    entity.waveStage = primitives.waveStage ?? null
    entity.waveStatus = primitives.waveStatus ?? null
    entity.planToGoLive = primitives.planToGoLive ?? null

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
