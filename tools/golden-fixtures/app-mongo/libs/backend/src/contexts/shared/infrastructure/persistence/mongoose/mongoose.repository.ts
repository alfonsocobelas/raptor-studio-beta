import { ClientSession, FilterQuery, Model } from 'mongoose'
import { Criteria } from '../../../domain/query/criteria'
import { MongooseCriteriaConverter } from './mongoose-criteria-converter'
import { MongooseTransactionManager } from './mongoose-transaction-manager'

export abstract class MongooseRepository<T> {
  constructor(
    private readonly transactionManager: MongooseTransactionManager,
    private readonly criteriaConverter: MongooseCriteriaConverter
  ) {}

  protected abstract model(): Model<T>

  // Sesión ligada a la transacción activa (o null fuera de runInTransaction). Encadenarla
  // con .session() en TODA lectura/escritura para que se una a la transacción del use case.
  protected session(): ClientSession | null {
    return this.transactionManager.getEntityManager()
  }

  protected async searchByCriteria(criteria: Criteria): Promise<T[]> {
    const query = this.criteriaConverter.buildQuery(criteria)

    let cursor = this.model()
      .find(this.excludeSoftDeleted(query.filter))
      .session(this.session())
      // Desempate determinista: la paginación por offset sin orden estable repite/salta filas
      // entre páginas. Se desempata por `id` (el UUIDv7 del dominio, ordenado en el tiempo) y NO
      // por el _id de Mongo: el predicado del cursor compara el id de dominio, y ordenar por otro
      // campo haría que sort y predicado siguieran órdenes distintos — saltando o repitiendo filas.
      .sort({ ...query.sort, id: 1 })

    if (query.skip) {
      cursor = cursor.skip(query.skip)
    }
    if (query.limit) {
      cursor = cursor.limit(query.limit)
    }

    return cursor.lean<T[]>().exec()
  }

  protected async countByCriteria(criteria: Criteria): Promise<number> {
    const query = this.criteriaConverter.buildQuery(criteria)

    return this.model().countDocuments(this.excludeSoftDeleted(query.filter)).session(this.session()).exec()
  }

  protected async existsByCriteria(criteria: Criteria): Promise<boolean> {
    const query = this.criteriaConverter.buildQuery(criteria)
    const found = await this.model().exists(this.excludeSoftDeleted(query.filter)).session(this.session())

    return found !== null
  }

  // La papelera (spec 29): mismas queries del criteria, pero SOLO sobre lo soft-borrado.
  // Únicamente las llaman los repositorios de entidades con softDelete.
  protected async searchDeletedByCriteria(criteria: Criteria): Promise<T[]> {
    const query = this.criteriaConverter.buildQuery(criteria)

    let cursor = this.model()
      .find(this.onlySoftDeleted(query.filter))
      .session(this.session())
      .sort({ ...query.sort, id: 1 })

    if (query.skip) {
      cursor = cursor.skip(query.skip)
    }
    if (query.limit) {
      cursor = cursor.limit(query.limit)
    }

    return cursor.lean<T[]>().exec()
  }

  protected async countDeletedByCriteria(criteria: Criteria): Promise<number> {
    const query = this.criteriaConverter.buildQuery(criteria)

    return this.model().countDocuments(this.onlySoftDeleted(query.filter)).session(this.session()).exec()
  }

  // Paridad con el soft-delete de la referencia: los documentos borrados llevan deletedAt
  // y ninguna consulta base los ve. $eq null casa tanto null como campo ausente.
  private excludeSoftDeleted(filter: FilterQuery<T>): FilterQuery<T> {
    return { ...filter, deletedAt: null } as FilterQuery<T>
  }

  // Inversa de excludeSoftDeleted: solo documentos con marca de borrado.
  private onlySoftDeleted(filter: FilterQuery<T>): FilterQuery<T> {
    return { ...filter, deletedAt: { $ne: null } } as FilterQuery<T>
  }
}
