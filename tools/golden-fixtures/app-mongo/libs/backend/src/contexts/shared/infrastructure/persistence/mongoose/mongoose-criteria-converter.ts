import { Injectable } from '@nestjs/common'
import { Criteria } from '../../../domain/query/criteria'
import { Cursor, CursorField } from '../../../domain/query/cursor'
import { Filter } from '../../../domain/query/filter'
import { Filters } from '../../../domain/query/filters'
import { GlobalSearch } from '../../../domain/query/global-search'
import { Orders } from '../../../domain/query/orders'
import { Operator } from '../../../domain/query/filter-operator'

type MongoFilterValue = string | number | boolean | string[] | null
type MongoCondition = Record<string, unknown>
type MongoSort = Record<string, 1 | -1>

export type MongoQuery = {
  filter: MongoCondition
  sort?: MongoSort
  cursor?: MongoCondition
  skip?: number
  limit?: number
}

@Injectable()
export class MongooseCriteriaConverter {
  buildQuery(criteria: Criteria): MongoQuery {
    const result: MongoQuery = { filter: {} }

    // Search y filtros componen en un único filter que la base aplica en un solo find(),
    // así search/count/exists honran la búsqueda global sin cambios en los repositorios.
    const conditions: MongoCondition[] = []
    if (criteria.hasSearch()) {
      conditions.push(this.generateSearch(criteria.search!))
    }
    if (criteria.hasFilters()) {
      conditions.push(...this.generateFilter(criteria.filters!))
    }
    if (conditions.length) {
      result.filter = conditions.length === 1 ? conditions[0] : { $and: conditions }
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

  // Paginación keyset. El cursor lleva el valor de la última fila por cada columna de orden
  // (siempre cerrando con el desempate no nulo "id"). Se construye el predicado lexicográfico
  // "fila estrictamente posterior al cursor" honrando ASC/DESC y la colocación NATIVA de nulls
  // de Mongo (asc → nulls primero, desc → nulls al final; la inversa de Postgres). El predicado
  // debe casar con el sort que aplica el repositorio base, no con el canon SQL.
  private generateCursor(cursor: Cursor, orders?: Orders): MongoCondition {
    const isAscByField = new Map((orders?.orders ?? []).map(o => [o.orderBy.value, o.orderType.isAsc()]))
    const position = cursor.position
    const lastIndex = position.length - 1
    const clauses: MongoCondition[] = []

    position.forEach((field, level) => {
      const mongoField = field.field
      const equalities = position.slice(0, level).map(prev => ({ [prev.field]: prev.value }))
      const isAsc = isAscByField.get(field.field) ?? true

      const advance =
        level === lastIndex
          ? { [mongoField]: { [isAsc ? '$gt' : '$lt']: field.value } } // desempate por id, nunca nulo
          : this.afterInColumn(mongoField, field, isAsc)

      if (!advance) {
        return // cláusula muerta (nada ordena después de un null cuando los nulls van al final)
      }

      clauses.push(equalities.length ? { $and: [...equalities, advance] } : advance)
    })

    return clauses.length === 1 ? clauses[0] : { $or: clauses }
  }

  // Filas cuya columna ordena estrictamente después del valor del cursor, ignorando el empate
  // (lo resuelve la cláusula del nivel siguiente). Devuelve null cuando no existen tales filas.
  private afterInColumn(mongoField: string, field: CursorField, isAsc: boolean): MongoCondition | null {
    if (isAsc) {
      // asc → nulls primero: después de un null vienen los no nulos y los valores
      if (field.value === null) {
        return { [mongoField]: { $ne: null } }
      }
      return { [mongoField]: { $gt: field.value } }
    }

    // desc → nulls al final
    if (field.value === null) {
      return null // nada ordena después de un null que ya va último
    }
    return { $or: [{ [mongoField]: { $lt: field.value } }, { [mongoField]: null }] }
  }

  // OR de regex case-insensitive sobre los campos buscables del módulo (equivalente al ILIKE).
  private generateSearch(search: GlobalSearch): MongoCondition {
    const pattern = this.escapeRegex(String(search.term))
    return { $or: search.fields.map(field => ({ [field]: { $regex: pattern, $options: 'i' } })) }
  }

  private generateFilter(filters: Filters): MongoCondition[] {
    return filters.filters.map(filter => this.transformFilter(filter))
  }

  // Escapa los metacaracteres de regex para que un valor tecleado con . * ( … case literalmente.
  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, char => `\\${char}`)
  }

  private transformFilter(filter: Filter): MongoCondition {
    const field = filter.field.value
    const value = filter.value.value as MongoFilterValue
    const pattern = typeof value === 'string' ? this.escapeRegex(value) : String(value)

    const map: Record<Operator, () => MongoCondition> = {
      [Operator.EQUAL]: () => ({ [field]: value }),
      [Operator.NOT_EQUAL]: () => ({ [field]: { $ne: value } }),
      [Operator.IN]: () => ({ [field]: { $in: value } }),
      [Operator.GT]: () => ({ [field]: { $gt: value } }),
      [Operator.GTE]: () => ({ [field]: { $gte: value } }),
      [Operator.LT]: () => ({ [field]: { $lt: value } }),
      [Operator.LTE]: () => ({ [field]: { $lte: value } }),
      [Operator.CONTAINS]: () => ({ [field]: { $regex: pattern, $options: 'i' } }),
      [Operator.NOT_CONTAINS]: () => ({ [field]: { $not: { $regex: pattern, $options: 'i' } } }),
      [Operator.STARTS_WITH]: () => ({ [field]: { $regex: `^${pattern}`, $options: 'i' } }),
      [Operator.ENDS_WITH]: () => ({ [field]: { $regex: `${pattern}$`, $options: 'i' } })
    }

    const builder = map[filter.operator.value]
    if (!builder) {
      throw new Error(`Unsupported operator: ${filter.operator.value}`)
    }
    return builder()
  }

  // Nota de paridad: Mongo coloca los null/ausentes al principio en asc y al final en desc
  // (la inversa de Postgres). El predicado de cursor de arriba sigue esta semántica nativa.
  private generateSort(orders: Orders): MongoSort {
    const sort: MongoSort = {}
    orders.orders.forEach(order => {
      sort[order.orderBy.value] = order.orderType.isAsc() ? 1 : -1
    })
    return sort
  }
}
