import { EntityManager, EntityTarget, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm'
import { AggregateOp } from '../../../domain/query/aggregate'
import { Criteria } from '../../../domain/query/criteria'
import { TypeOrmCriteriaConverter } from './typeorm-criteria-converter'
import { TypeOrmTransactionManager } from './typeorm-transaction-manager'

export abstract class TypeOrmRepository<T extends ObjectLiteral> {
  constructor(
    private readonly transactionManager: TypeOrmTransactionManager,
    private readonly criteriaConverter: TypeOrmCriteriaConverter
  ) {}

  protected abstract entityTarget(): EntityTarget<T>

  // Transaction-aware EntityManager: the one bound to the active transaction when running inside
  // runInTransaction, or the default connection manager otherwise. Use this (not the DataSource)
  // whenever a repository needs a secondary repository or an ad-hoc query so it joins the ambient tx.
  protected client(): EntityManager {
    return this.transactionManager.getEntityManager()
  }

  protected repository(): Repository<T> {
    return this.client().getRepository(this.entityTarget())
  }

  protected async searchByCriteria(criteria: Criteria): Promise<T[]> {
    const qb = this.repository().createQueryBuilder('entity')
    const query = this.criteriaConverter.buildQuery(criteria)

    if (query.filter) {
      qb.where(query.filter.query, query.filter.params)
    }
    if (query.cursor) {
      qb.andWhere(query.cursor.query, query.cursor.params)
    }
    this.excludeSoftDeleted(qb)
    if (query.sort) {
      qb.orderBy(query.sort)
    }
    // Deterministic tiebreaker: offset pagination without a stable ORDER BY can repeat/skip rows
    // across pages. id is the UUIDv7 primary key (time-ordered), so it also gives a sensible default
    // order when no explicit sort is requested.
    qb.addOrderBy('entity.id', 'ASC')
    if (query.skip) {
      qb.skip(query.skip)
    }
    if (query.limit) {
      qb.take(query.limit)
    }

    return qb.getMany()
  }

  protected async countByCriteria(criteria: Criteria): Promise<number> {
    const qb = this.repository().createQueryBuilder('entity')
    const query = this.criteriaConverter.buildQuery(criteria)

    if (query.filter) {
      qb.where(query.filter.query, query.filter.params)
    }
    this.excludeSoftDeleted(qb)

    return qb.getCount()
  }

  /**
   * Una agregación sobre el conjunto filtrado (spec 71). `field` se interpola en la expresión, así
   * que llega YA validado contra la lista blanca del recurso (`aggregatableFields` de su config):
   * este método no es la frontera de confianza, el caso de uso lo es.
   *
   * El vacío no responde lo mismo en todas las operaciones: la suma de nada es 0 y los distintos
   * de nada son 0, pero la media, el máximo y el mínimo de nada NO son 0 — son «no hay dato».
   */
  protected async aggregateByCriteria(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null> {
    const qb = this.repository().createQueryBuilder('entity')
    const query = this.criteriaConverter.buildQuery(criteria)

    if (query.filter) {
      qb.where(query.filter.query, query.filter.params)
    }
    this.excludeSoftDeleted(qb)

    const column = `entity.${field}`
    const expression = op === 'distinct' ? `COUNT(DISTINCT ${column})` : `${op.toUpperCase()}(${column})`
    const raw = await qb.select(expression, 'value').getRawOne<{ value: string | number | Date | null }>()

    if (raw?.value === null || raw?.value === undefined) {
      return op === 'sum' || op === 'distinct' ? 0 : null
    }
    return toAggregateNumber(raw.value)
  }

  protected async existsByCriteria(criteria: Criteria): Promise<boolean> {
    const qb = this.repository().createQueryBuilder('entity')
    const query = this.criteriaConverter.buildQuery(criteria)

    if (query.filter) {
      qb.where(query.filter.query, query.filter.params)
    }
    this.excludeSoftDeleted(qb)

    return qb.select('1').getExists()
  }

  // createQueryBuilder does not auto-apply the soft-delete filter to the root entity
  // (only to joined relations / find() options), so we add it explicitly when the
  // entity has a delete date column. Safe for entities without soft-delete.
  private excludeSoftDeleted(qb: SelectQueryBuilder<T>): void {
    const deleteColumn = this.repository().metadata.deleteDateColumn
    if (deleteColumn) {
      qb.andWhere(`entity.${deleteColumn.propertyName} IS NULL`)
    }
  }
}

/**
 * El motor devuelve cada columna a su manera: `numeric` vuelve como CADENA (sin esto, `sum`
 * concatenaría), una `timestamptz` como Date y una `date` como cadena 'YYYY-MM-DD'.
 *
 * Una fecha se transporta como milisegundos de época —el único número en el que cabe— y quien la
 * pinta la vuelve a fecha. Lo que no se pueda leer como número no es un 0: es «no hay dato».
 */
export function toAggregateNumber(value: string | number | Date): number | null {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()

  const numeric = Number(value)
  if (!Number.isNaN(numeric)) return numeric

  const asDate = new Date(value).getTime()
  return Number.isNaN(asDate) ? null : asDate
}
