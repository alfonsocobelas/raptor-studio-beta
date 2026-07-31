import { Injectable } from '@nestjs/common'
import { Criteria } from '../../../domain/query/criteria'
import { Cursor, CursorField } from '../../../domain/query/cursor'
import { Filter } from '../../../domain/query/filter'
import { Filters } from '../../../domain/query/filters'
import { GlobalSearch } from '../../../domain/query/global-search'
import { Orders } from '../../../domain/query/orders'
import { Operator } from '../../../domain/query/filter-operator'

type TypeOrmFilterValue = string | number | boolean | string[]
type TypeOrmFilter = { query: string; params: Record<string, TypeOrmFilterValue> }
type TypeOrmSortColumn = { order: 'ASC' | 'DESC'; nulls: 'NULLS FIRST' | 'NULLS LAST' }
type TypeOrmSort = Record<string, TypeOrmSortColumn>

export type TypeOrmQuery = {
  filter?: TypeOrmFilter
  sort?: TypeOrmSort
  cursor?: TypeOrmFilter
  skip?: number
  limit?: number
}

@Injectable()
export class TypeOrmCriteriaConverter {
  buildQuery(criteria: Criteria): TypeOrmQuery {
    const result: TypeOrmQuery = {}

    // Search and filters compose into the single `filter` the base repository applies with one
    // where(), so search/count/exists all honour the global search without repository changes.
    const filter = this.combineFilters(
      criteria.hasSearch() ? this.generateSearch(criteria.search!) : undefined,
      criteria.hasFilters() ? this.generateFilter(criteria.filters!) : undefined
    )
    if (filter) {
      result.filter = filter
    }
    if (criteria.hasOrders()) {
      result.sort = this.generateSort(criteria.orders!)
    }
    if (criteria.cursor) {
      result.cursor = this.generateCursor(criteria.cursor, criteria.orders)
    }
    if (criteria.offset) {
      result.skip = criteria.offset
    }
    if (criteria.limit) {
      result.limit = criteria.limit
    }

    return result
  }

  // Keyset pagination. The cursor carries the last row's value for every ORDER BY column
  // (always ending in the non-null "id" tie-breaker). We build the lexicographic
  // "row strictly after the cursor" predicate, honouring per-column ASC/DESC and NULL
  // placement (ASC → NULLS LAST, DESC → NULLS FIRST). Correct for 0..1 nullable user
  // column plus the id tie-breaker (the shape the product allows).
  private generateCursor(cursor: Cursor, orders?: Orders): TypeOrmFilter {
    const isAscByField = new Map((orders?.orders ?? []).map(o => [o.orderBy.value, o.orderType.isAsc()]))
    const position = cursor.position
    const lastIndex = position.length - 1
    const params: Record<string, TypeOrmFilterValue> = {}
    const clauses: string[] = []

    position.forEach((field, level) => {
      const equalities = position.slice(0, level).map(prev => this.equalInColumn(prev, params))
      const isAsc = isAscByField.get(field.field) ?? true

      const advance =
        level === lastIndex
          ? this.strictInColumn(field, isAsc, level, params) // non-null id tie-breaker
          : this.afterInColumn(field, isAsc, params)

      if (!advance) {
        return // dead clause (e.g. nothing sorts after a NULL when NULLs are last)
      }

      const parts = [...equalities, advance]
      clauses.push(parts.length > 1 ? `(${parts.join(' AND ')})` : parts[0])
    })

    return { query: clauses.join(' OR '), params }
  }

  private equalInColumn(field: CursorField, params: Record<string, TypeOrmFilterValue>): string {
    const column = `entity.${field.field}`
    if (field.value === null) {
      return `${column} IS NULL`
    }
    const param = `eq_${field.field}`
    params[param] = field.value
    return `${column} = :${param}`
  }

  private strictInColumn(
    field: CursorField,
    isAsc: boolean,
    level: number,
    params: Record<string, TypeOrmFilterValue>
  ): string {
    const param = `cursor_${level}`
    params[param] = field.value as TypeOrmFilterValue
    return `entity.${field.field} ${isAsc ? '>' : '<'} :${param}`
  }

  // Rows whose column sorts strictly after the cursor value, ignoring the tie (handled by
  // the equality-prefixed clause of the next level). Returns '' when no such rows exist.
  private afterInColumn(field: CursorField, isAsc: boolean, params: Record<string, TypeOrmFilterValue>): string {
    const column = `entity.${field.field}`

    if (isAsc) {
      // NULLS LAST: non-null rows precede NULLs
      if (field.value === null) {
        return '' // nothing sorts after a NULL that is already last
      }
      const param = `gt_${field.field}`
      params[param] = field.value
      return `(${column} > :${param} OR ${column} IS NULL)`
    }

    // DESC → NULLS FIRST: NULLs precede non-null rows (descending)
    if (field.value === null) {
      return `${column} IS NOT NULL`
    }
    const param = `gt_${field.field}`
    params[param] = field.value
    return `${column} < :${param}`
  }

  // OR of ILIKE over the module's searchable fields; parenthesised so it ANDs cleanly with filters.
  // The alias `global_search` cannot collide with filter aliases (they are `{field}_{index}`).
  private generateSearch(search: GlobalSearch): TypeOrmFilter {
    const clauses = search.fields.map(field => `entity.${field} ILIKE :global_search`)
    return {
      query: `(${clauses.join(' OR ')})`,
      params: { global_search: `%${this.escapeLike(search.term)}%` }
    }
  }

  private combineFilters(search?: TypeOrmFilter, filter?: TypeOrmFilter): TypeOrmFilter | undefined {
    if (!search || !filter) {
      return search ?? filter
    }
    return {
      query: `${search.query} AND ${filter.query}`,
      params: { ...search.params, ...filter.params }
    }
  }

  private generateFilter(filters: Filters): TypeOrmFilter {
    const queryParts: string[] = []
    const params: Record<string, TypeOrmFilterValue> = {}

    filters.filters.forEach((filter, index) => {
      const alias = `${filter.field.value}_${index}`
      const result = this.transformFilter(filter, alias)
      queryParts.push(result.query)
      Object.assign(params, result.params)
    })

    return { query: queryParts.join(' AND '), params }
  }

  // Escape LIKE/ILIKE wildcards so a user-typed % or _ matches literally instead of acting as a
  // wildcard. Relies on Postgres' default LIKE escape character (backslash); the value is bound as a
  // parameter, so this is about pattern semantics, not SQL injection (which parameterisation prevents).
  private escapeLike(value: TypeOrmFilterValue): TypeOrmFilterValue {
    return typeof value === 'string' ? value.replace(/[\\%_]/g, char => `\\${char}`) : value
  }

  private transformFilter(filter: Filter, alias: string): TypeOrmFilter {
    const field = `entity.${filter.field.value}`
    const value = filter.value.value as TypeOrmFilterValue
    const like = this.escapeLike(value)

    const map: Record<Operator, () => TypeOrmFilter> = {
      [Operator.EQUAL]: () => ({ query: `${field} = :${alias}`, params: { [alias]: value } }),
      [Operator.NOT_EQUAL]: () => ({ query: `${field} != :${alias}`, params: { [alias]: value } }),
      [Operator.IN]: () => ({ query: `${field} IN (:...${alias})`, params: { [alias]: value } }),
      [Operator.GT]: () => ({ query: `${field} > :${alias}`, params: { [alias]: value } }),
      [Operator.GTE]: () => ({ query: `${field} >= :${alias}`, params: { [alias]: value } }),
      [Operator.LT]: () => ({ query: `${field} < :${alias}`, params: { [alias]: value } }),
      [Operator.LTE]: () => ({ query: `${field} <= :${alias}`, params: { [alias]: value } }),
      [Operator.CONTAINS]: () => ({ query: `${field} ILIKE :${alias}`, params: { [alias]: `%${like}%` } }),
      [Operator.NOT_CONTAINS]: () => ({ query: `${field} NOT ILIKE :${alias}`, params: { [alias]: `%${like}%` } }),
      [Operator.STARTS_WITH]: () => ({ query: `${field} ILIKE :${alias}`, params: { [alias]: `${like}%` } }),
      [Operator.ENDS_WITH]: () => ({ query: `${field} ILIKE :${alias}`, params: { [alias]: `%${like}` } })
    }

    const builder = map[filter.operator.value]
    if (!builder) {
      throw new Error(`Unsupported operator: ${filter.operator.value}`)
    }
    return builder()
  }

  // NULL placement is made explicit (matching PostgreSQL defaults: ASC → NULLS LAST,
  // DESC → NULLS FIRST) so the ORDER BY stays in lockstep with the cursor keyset predicate.
  private generateSort(orders: Orders): TypeOrmSort {
    const sort: TypeOrmSort = {}
    orders.orders.forEach(order => {
      const isAsc = order.orderType.isAsc()
      sort[`entity.${order.orderBy.value}`] = {
        order: isAsc ? 'ASC' : 'DESC',
        nulls: isAsc ? 'NULLS LAST' : 'NULLS FIRST'
      }
    })
    return sort
  }
}
