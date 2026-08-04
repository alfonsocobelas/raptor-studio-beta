import { Project } from '../../../domain/project'
import { ProjectDoc } from './project.schema'

export class ProjectMapper {
  static toDomain(doc: ProjectDoc): Project {
    return Project.fromPrimitives({
      id: doc.id,
      customerId: doc.customerId,
      customerName: doc.customerName,
      name: doc.name,
      description: doc.description,
      startDate: doc.startDate,
      endDate: doc.endDate,
      status: doc.status,
      implementer: doc.implementer,
      origin: doc.origin,
      lifecycleStatus: doc.lifecycleStatus,
      archivedAt: doc.archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: doc.lastSeenInSyncAt?.toISOString() ?? null,
      sapProjectId: doc.sapProjectId,
      atRisk: doc.atRisk,
      inEscalation: doc.inEscalation,
      nbrOfWaves: doc.nbrOfWaves,
      waveStage: doc.waveStage,
      waveStatus: doc.waveStatus,
      planToGoLive: doc.planToGoLive
    })
  }

  // El documento se reemplaza entero en cada save: los hijos embebidos viajan dentro,
  // así que no hay dos escrituras que coordinar (esa es la ventaja del agregado embebido)
  static toPersistence(domain: Project): ProjectDoc {
    const primitives = domain.toPrimitives()

    return {
      id: primitives.id,
      customerId: primitives.customerId,
      customerName: primitives.customerName,
      name: primitives.name,
      description: primitives.description,
      startDate: primitives.startDate,
      endDate: primitives.endDate,
      status: primitives.status,
      implementer: primitives.implementer,
      origin: primitives.origin ?? 'MANUAL',
      lifecycleStatus: primitives.lifecycleStatus ?? 'active',
      archivedAt: primitives.archivedAt ? new Date(primitives.archivedAt) : null,
      lastSeenInSyncAt: primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null,
      sapProjectId: primitives.sapProjectId ?? null,
      atRisk: primitives.atRisk ?? null,
      inEscalation: primitives.inEscalation ?? null,
      nbrOfWaves: primitives.nbrOfWaves ?? null,
      waveStage: primitives.waveStage ?? null,
      waveStatus: primitives.waveStatus ?? null,
      planToGoLive: primitives.planToGoLive ?? null
    }
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
