import { ClientSession, FilterQuery, Model } from 'mongoose'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../domain/query/aggregate'
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

    // null no es un valor distinto: COUNT(DISTINCT) de Postgres lo excluye y los motores coinciden
    const group =
      op === 'distinct'
        ? [{ $match: { [field]: { $ne: null } } }, { $group: { _id: `$${field}` } }, { $count: 'value' }]
        : [{ $group: { _id: null, value: { [`$${op}`]: `$${field}` } } }]

    const rows = await this.model()
      .aggregate<{ value: number | Date | null }>([{ $match: match }, ...group])
      .session(this.session())
      .exec()

    if (!rows.length || rows[0].value === null || rows[0].value === undefined) {
      return op === 'sum' || op === 'distinct' ? 0 : null
    }
    // `$max` sobre una fecha devuelve una Date: se transporta como milisegundos de época
    const value = rows[0].value
    if (value instanceof Date) return value.getTime()
    const numeric = Number(value)
    return Number.isNaN(numeric) ? null : numeric
  }

  /**
   * El mismo desglose que en la otra ranura (spec 72). `date_trunc` no existe aquí: el mes se
   * compone con `$dateToString`, que da directamente la clave 'YYYY-MM'.
   *
   * Se piden `limit + 1` grupos: si vuelve uno de más, el desglose venía recortado.
   */
  protected async aggregateGroupedByCriteria(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]> {
    const query = this.criteriaConverter.buildQuery(criteria)
    const match = this.excludeSoftDeleted(query.filter)

    const axis = spec.bucketField
      ? { $dateToString: { format: '%Y-%m', date: `$${spec.bucketField}` } }
      : `$${spec.groupBy}`
    const measure = spec.op === 'count' || spec.op === 'distinct' ? { $sum: 1 } : { [`$${spec.op}`]: `$${spec.field}` }

    // `distinct` agrupado se resuelve en dos pasos: primero los pares (grupo, valor), luego se
    // cuentan los valores de cada grupo — un $addToSet sobre datos grandes se sale del límite de
    // 16 MB por documento
    const pipeline =
      spec.op === 'distinct'
        ? [
            { $match: match },
            // null no es un valor distinto (mismo criterio que en la agregación simple)
            { $match: { [spec.field as string]: { $ne: null } } },
            { $group: { _id: { key: axis, value: `$${spec.field}` } } },
            { $group: { _id: '$_id.key', value: { $sum: 1 } } }
          ]
        : [{ $match: match }, { $group: { _id: axis, value: measure } }]

    const rows = await this.model()
      .aggregate<{ _id: string | Date | null; value: number | Date | null }>([
        ...pipeline,
        { $sort: { value: -1 } },
        { $limit: spec.limit + 1 }
      ])
      .session(this.session())
      .exec()

    return rows.map(row => ({
      key: row._id instanceof Date ? row._id.toISOString().slice(0, 7) : String(row._id ?? ''),
      value:
        row.value === null || row.value === undefined
          ? null
          : row.value instanceof Date
            ? row.value.getTime()
            : Number(row.value)
    }))
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
