import { ClientSession, FilterQuery, Model } from 'mongoose'
import { AggregateOp } from '../../../domain/query/aggregate'
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

  /**
   * La misma agregación que en la otra ranura (spec 71), con el mismo filtro y el mismo borrado
   * lógico. `field` llega YA validado contra la lista blanca del recurso.
   *
   * Mongo coincide con el contrato sin forzarlo: `$sum` del vacío es 0 y `$avg` del vacío es null.
   * Los distintos se cuentan agrupando por el valor y contando grupos.
   */
  protected async aggregateByCriteria(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null> {
    const query = this.criteriaConverter.buildQuery(criteria)
    const match = this.excludeSoftDeleted(query.filter)

    const group =
      op === 'distinct'
        ? [{ $group: { _id: `$${field}` } }, { $count: 'value' }]
        : [{ $group: { _id: null, value: { [`$${op}`]: `$${field}` } } }]

    const rows = await this.model()
      .aggregate<{ value: number | null }>([{ $match: match }, ...group])
      .session(this.session())
      .exec()

    if (!rows.length || rows[0].value === null || rows[0].value === undefined) {
      return op === 'sum' || op === 'distinct' ? 0 : null
    }
    return Number(rows[0].value)
  }

  protected async existsByCriteria(criteria: Criteria): Promise<boolean> {
    const query = this.criteriaConverter.buildQuery(criteria)
    const found = await this.model().exists(this.excludeSoftDeleted(query.filter)).session(this.session())

    return found !== null
  }

  // Paridad con el soft-delete de la referencia: los documentos borrados llevan deletedAt
  // y ninguna consulta base los ve. $eq null casa tanto null como campo ausente.
  private excludeSoftDeleted(filter: FilterQuery<T>): FilterQuery<T> {
    return { ...filter, deletedAt: null } as FilterQuery<T>
  }
}
