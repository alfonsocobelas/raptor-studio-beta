import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AlreadyExistsError } from '../../../../../../shared/domain/errors'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ContractId } from '../../../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { MongooseCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-criteria-converter'
import { MongooseRepository } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose.repository'
import { MongooseTransactionManager } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-transaction-manager'
import { Contract } from '../../../domain/contract'
import { ContractRepository } from '../../../domain/contract-repository'
import { ContractNumber } from '../../../../../shared/domain/value-objects/contract-number.vo'
import { ContractMapper } from './contract.mapper'
import { ContractDoc } from './contract.schema'

@Injectable()
export class MongooseContractRepository extends MongooseRepository<ContractDoc> implements ContractRepository {
  constructor(
    @InjectModel('Contract') private readonly contractModel: Model<ContractDoc>,
    transactionManager: MongooseTransactionManager,
    criteriaConverter: MongooseCriteriaConverter
  ) {
    super(transactionManager, criteriaConverter)
  }

  protected model(): Model<ContractDoc> {
    return this.contractModel
  }

  async register(contract: Contract): Promise<void> {
    const doc = ContractMapper.toPersistence(contract)

    try {
      await this.model().create([doc], { session: this.session() ?? undefined })
    } catch (error) {
      throw this.asDomainError(error)
    }
  }

  // Reemplazo del documento completo: el agregado es la unidad de escritura.
  async save(contract: Contract): Promise<void> {
    const doc = ContractMapper.toPersistence(contract)

    try {
      await this.model().replaceOne({ id: doc.id }, doc, { upsert: true }).session(this.session()).exec()
    } catch (error) {
      throw this.asDomainError(error)
    }
  }

  async get(contractId: ContractId): Promise<Nullable<Contract>> {
    return this.findOne({ id: contractId.value })
  }

  async matching(criteria: Criteria): Promise<Contract[]> {
    const docs = await this.searchByCriteria(criteria)

    return docs.map(ContractMapper.toDomain)
  }

  async findByContractNumber(contractNumber: ContractNumber): Promise<Nullable<Contract>> {
    return this.findOne({ contractNumber: contractNumber.value })
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
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

  // Revierte UNA operación: vuelve exactamente lo que ella arrastró (decisión 1, spec 38)
  async restoreByOp(op: DeleteOperationId): Promise<number> {
    const result = await this.model()
      .updateMany({ deletedOp: op.value }, { $set: { deletedAt: null, deletedOp: null } })
      .session(this.session())
      .exec()
    return result.modifiedCount
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end

  // Los borrados en suave no existen para el dominio: mismo criterio que el repo base.
  private async findOne(filter: Record<string, unknown>): Promise<Nullable<Contract>> {
    const doc = await this.model()
      .findOne({ ...filter, deletedAt: null })
      .session(this.session())
      .lean<ContractDoc>()
      .exec()

    return doc ? ContractMapper.toDomain(doc) : null
  }

  // E11000 es el choque de un índice único. Sin esto el error del driver se escaparía
  // tal cual a la capa de aplicación; traducido, es el mismo conflicto que ya conoce.
  private asDomainError(error: unknown): unknown {
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      const key = Object.keys((error as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0] ?? 'unique field'
      const value = String((error as { keyValue?: Record<string, unknown> }).keyValue?.[key] ?? '')

      return new AlreadyExistsError('Contract', key, value, error)
    }

    return error
  }
}
