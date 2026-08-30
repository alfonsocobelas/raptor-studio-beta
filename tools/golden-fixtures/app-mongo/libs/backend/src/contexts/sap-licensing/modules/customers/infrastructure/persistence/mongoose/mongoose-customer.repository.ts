import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AlreadyExistsError, ConcurrencyConflictError } from '../../../../../../shared/domain/errors'
import { Nullable } from '../../../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { CustomerId } from '../../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { MongooseCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-criteria-converter'
import { MongooseRepository } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose.repository'
import { MongooseTransactionManager } from '../../../../../../shared/infrastructure/persistence/mongoose/mongoose-transaction-manager'
import { Customer } from '../../../domain/customer'
import { CustomerRepository } from '../../../domain/customer-repository'
import { SapId } from '../../../domain/value-objects/sap-id.vo'
import { TaxId } from '../../../domain/value-objects/tax-id.vo'
import { CustomerMapper } from './customer.mapper'
import { CustomerDoc } from './customer.schema'

@Injectable()
export class MongooseCustomerRepository extends MongooseRepository<CustomerDoc> implements CustomerRepository {
  constructor(
    @InjectModel('Customer') private readonly customerModel: Model<CustomerDoc>,
    transactionManager: MongooseTransactionManager,
    criteriaConverter: MongooseCriteriaConverter
  ) {
    super(transactionManager, criteriaConverter)
  }

  protected model(): Model<CustomerDoc> {
    return this.customerModel
  }

  async register(customer: Customer): Promise<void> {
    const doc = CustomerMapper.toPersistence(customer)

    try {
      await this.model().create([doc], { session: this.session() ?? undefined })
    } catch (error) {
      throw this.asDomainError(error)
    }
  }

  // Un solo write: los contacts van embebidos en el documento, así que el agregado se
  // reemplaza entero y no hay dos escrituras que coordinar (ni huérfanos que soft-borrar).
  // Escritura condicional (spec 78): solo reemplaza el documento si nadie lo movió desde la lectura
  async save(customer: Customer): Promise<void> {
    const doc = CustomerMapper.toPersistence(customer)

    try {
      const result = await this.model()
        .replaceOne({ id: doc.id, version: doc.version }, { ...doc, version: doc.version + 1 })
        .session(this.session())
        .exec()

      if (result.matchedCount === 0) {
        throw new ConcurrencyConflictError('Customer', doc.id)
      }
    } catch (error) {
      if (error instanceof ConcurrencyConflictError) {
        throw error
      }
      throw this.asDomainError(error)
    }
  }

  async get(customerId: CustomerId): Promise<Nullable<Customer>> {
    return this.findOne({ id: customerId.value })
  }

  async matching(criteria: Criteria): Promise<Customer[]> {
    const docs = await this.searchByCriteria(criteria)

    return docs.map(CustomerMapper.toDomain)
  }

  async findBySapId(sapId: SapId): Promise<Nullable<Customer>> {
    return this.findOne({ sapId: sapId.value })
  }

  async findByTaxId(taxId: TaxId): Promise<Nullable<Customer>> {
    return this.findOne({ taxId: taxId.value })
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

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end

  // Los borrados en suave no existen para el dominio: mismo criterio que el repo base.
  private async findOne(filter: Record<string, unknown>): Promise<Nullable<Customer>> {
    const doc = await this.model()
      .findOne({ ...filter, deletedAt: null })
      .session(this.session())
      .lean<CustomerDoc>()
      .exec()

    return doc ? CustomerMapper.toDomain(doc) : null
  }

  // E11000 es el choque de un índice único. Sin esto el error del driver se escaparía
  // tal cual a la capa de aplicación; traducido, es el mismo conflicto que ya conoce.
  private asDomainError(error: unknown): unknown {
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      const key = Object.keys((error as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0] ?? 'unique field'
      const value = String((error as { keyValue?: Record<string, unknown> }).keyValue?.[key] ?? '')

      return new AlreadyExistsError('Customer', key, value, error)
    }

    return error
  }
}
