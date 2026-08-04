import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AlreadyExistsError } from '../../../../../../shared/domain/errors'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ProjectId } from '../../../../../../shared/domain/value-objects/projects/project-id.vo'
import { MongooseCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-criteria-converter'
import { MongooseRepository } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose.repository'
import { MongooseTransactionManager } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-transaction-manager'
import { Project } from '../../../domain/project'
import { ProjectRepository } from '../../../domain/project-repository'
import { ProjectName } from '../../../domain/value-objects/project-name.vo'
import { ProjectMapper } from './project.mapper'
import { ProjectDoc } from './project.schema'

@Injectable()
export class MongooseProjectRepository extends MongooseRepository<ProjectDoc> implements ProjectRepository {
  constructor(
    @InjectModel('Project') private readonly projectModel: Model<ProjectDoc>,
    transactionManager: MongooseTransactionManager,
    criteriaConverter: MongooseCriteriaConverter
  ) {
    super(transactionManager, criteriaConverter)
  }

  protected model(): Model<ProjectDoc> {
    return this.projectModel
  }

  async register(project: Project): Promise<void> {
    const doc = ProjectMapper.toPersistence(project)

    try {
      await this.model().create([doc], { session: this.session() ?? undefined })
    } catch (error) {
      throw this.asDomainError(error)
    }
  }

  // Reemplazo del documento completo: el agregado es la unidad de escritura.
  async save(project: Project): Promise<void> {
    const doc = ProjectMapper.toPersistence(project)

    try {
      await this.model().replaceOne({ id: doc.id }, doc, { upsert: true }).session(this.session()).exec()
    } catch (error) {
      throw this.asDomainError(error)
    }
  }

  async remove(projectId: ProjectId): Promise<void> {
    // soft-delete: el documento se marca y ninguna consulta base lo vuelve a ver
    await this.model()
      .updateOne({ id: projectId.value }, { $set: { deletedAt: new Date() } })
      .session(this.session())
      .exec()
  }

  async get(projectId: ProjectId): Promise<Nullable<Project>> {
    return this.findOne({ id: projectId.value })
  }

  async matching(criteria: Criteria): Promise<Project[]> {
    const docs = await this.searchByCriteria(criteria)

    return docs.map(ProjectMapper.toDomain)
  }

  async findByName(name: ProjectName): Promise<Nullable<Project>> {
    return this.findOne({ name: name.value })
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end

  // Los borrados en suave no existen para el dominio: mismo criterio que el repo base.
  private async findOne(filter: Record<string, unknown>): Promise<Nullable<Project>> {
    const doc = await this.model()
      .findOne({ ...filter, deletedAt: null })
      .session(this.session())
      .lean<ProjectDoc>()
      .exec()

    return doc ? ProjectMapper.toDomain(doc) : null
  }

  // E11000 es el choque de un índice único. Sin esto el error del driver se escaparía
  // tal cual a la capa de aplicación; traducido, es el mismo conflicto que ya conoce.
  private asDomainError(error: unknown): unknown {
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      const key = Object.keys((error as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0] ?? 'unique field'
      const value = String((error as { keyValue?: Record<string, unknown> }).keyValue?.[key] ?? '')

      return new AlreadyExistsError('Project', key, value, error)
    }

    return error
  }
}
