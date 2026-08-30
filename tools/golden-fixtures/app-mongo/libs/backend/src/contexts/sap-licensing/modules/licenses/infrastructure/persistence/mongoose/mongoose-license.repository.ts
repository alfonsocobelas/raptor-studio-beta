import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AlreadyExistsError, ConcurrencyConflictError } from '../../../../../../shared/domain/errors'
import { Nullable } from '../../../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { LicenseId } from '../../../../../../shared/domain/value-objects/licenses/license-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { MongooseCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-criteria-converter'
import { MongooseRepository } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose.repository'
import { MongooseTransactionManager } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-transaction-manager'
import { License } from '../../../domain/license'
import { LicenseRepository } from '../../../domain/license-repository'
import { LicenseMapper } from './license.mapper'
import { LicenseDoc } from './license.schema'

@Injectable()
export class MongooseLicenseRepository extends MongooseRepository<LicenseDoc> implements LicenseRepository {
  constructor(
    @InjectModel('License') private readonly licenseModel: Model<LicenseDoc>,
    transactionManager: MongooseTransactionManager,
    criteriaConverter: MongooseCriteriaConverter
  ) {
    super(transactionManager, criteriaConverter)
  }

  protected model(): Model<LicenseDoc> {
    return this.licenseModel
  }

  async register(license: License): Promise<void> {
    const doc = LicenseMapper.toPersistence(license)

    try {
      await this.model().create([doc], { session: this.session() ?? undefined })
    } catch (error) {
      throw this.asDomainError(error)
    }
  }

  // Reemplazo del documento completo: el agregado es la unidad de escritura.
  // Escritura condicional (spec 78): solo reemplaza el documento si nadie lo movió desde la lectura
  async save(license: License): Promise<void> {
    const doc = LicenseMapper.toPersistence(license)

    try {
      const result = await this.model()
        .replaceOne({ id: doc.id, version: doc.version }, { ...doc, version: doc.version + 1 })
        .session(this.session())
        .exec()

      if (result.matchedCount === 0) {
        throw new ConcurrencyConflictError('License', doc.id)
      }
    } catch (error) {
      if (error instanceof ConcurrencyConflictError) {
        throw error
      }
      throw this.asDomainError(error)
    }
  }

  async get(licenseId: LicenseId): Promise<Nullable<License>> {
    return this.findOne({ id: licenseId.value })
  }

  async matching(criteria: Criteria): Promise<License[]> {
    const docs = await this.searchByCriteria(criteria)

    return docs.map(LicenseMapper.toDomain)
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  async aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null> {
    return this.aggregateByCriteria(criteria, op, field)
  }

  async aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]> {
    return this.aggregateGroupedByCriteria(criteria, spec)
  }

  async removeDraggedByContractId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    if (!parentIds.length) return []
    const rows = await this.model()
      .find({ contractId: { $in: parentIds }, deletedAt: null }, { id: 1 })
      .session(this.session())
      .exec()
    const ids = rows.map(row => row.id)
    if (ids.length) {
      await this.model()
        .updateMany({ id: { $in: ids } }, { $set: { deletedAt: new Date(), deletedOp: op.value } })
        .session(this.session())
        .exec()
    }
    return ids
  }

  async removeDraggedByCustomerId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    if (!parentIds.length) return []
    const rows = await this.model()
      .find({ customerId: { $in: parentIds }, deletedAt: null }, { id: 1 })
      .session(this.session())
      .exec()
    const ids = rows.map(row => row.id)
    if (ids.length) {
      await this.model()
        .updateMany({ id: { $in: ids } }, { $set: { deletedAt: new Date(), deletedOp: op.value } })
        .session(this.session())
        .exec()
    }
    return ids
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end

  // Los borrados en suave no existen para el dominio: mismo criterio que el repo base.
  private async findOne(filter: Record<string, unknown>): Promise<Nullable<License>> {
    const doc = await this.model()
      .findOne({ ...filter, deletedAt: null })
      .session(this.session())
      .lean<LicenseDoc>()
      .exec()

    return doc ? LicenseMapper.toDomain(doc) : null
  }

  // E11000 es el choque de un índice único. Sin esto el error del driver se escaparía
  // tal cual a la capa de aplicación; traducido, es el mismo conflicto que ya conoce.
  private asDomainError(error: unknown): unknown {
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      const key = Object.keys((error as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0] ?? 'unique field'
      const value = String((error as { keyValue?: Record<string, unknown> }).keyValue?.[key] ?? '')

      return new AlreadyExistsError('License', key, value, error)
    }

    return error
  }
}
