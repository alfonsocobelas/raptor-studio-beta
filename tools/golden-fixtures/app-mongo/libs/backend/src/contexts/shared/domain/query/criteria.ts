import { CriteriaValidator } from './criteria-validator'
import { Filter } from './filter'
import { Filters } from './filters'
import { GlobalSearch } from './global-search'
import { Orders } from './orders'
import { Cursor } from './cursor'

interface CriteriaParams {
  filters?: Filters
  orders?: Orders
  search?: GlobalSearch
  cursor?: Cursor
  offset?: number
  limit?: number
}

interface BaseInput {
  filters?: Array<Map<string, string>>
  orders?: Array<Map<string, string>>
  pageSize: number
}

export interface OffsetInput extends BaseInput {
  page: number
  search?: string
}

export interface CursorInput extends BaseInput {
  cursor?: string
}

export interface UnpaginatedInput {
  filters?: Array<Map<string, string>>
  orders?: Array<Map<string, string>>
  search?: string
}

export class Criteria {
  readonly filters?: Filters
  readonly orders?: Orders
  readonly search?: GlobalSearch
  readonly cursor?: Cursor
  readonly offset?: number
  readonly limit?: number

  constructor(params: CriteriaParams) {
    this.filters = params.filters
    this.orders = params.orders
    this.search = params.search
    this.cursor = params.cursor
    this.offset = params.offset
    this.limit = params.limit
  }

  // The searchable fields are the module's own allowlist (injected by the use case, never
  // client-provided); a module without searchable fields simply ignores the search term.
  private static buildSearch(term: string | undefined, searchableFields: string[]): GlobalSearch | undefined {
    if (!term || !searchableFields.length) {
      return undefined
    }
    return GlobalSearch.create(term, searchableFields) ?? undefined
  }

  static fromCursor(input: CursorInput, allowedFilters: string[], allowedOrders: string[]): Criteria {
    const { filters, orders = [], cursor, pageSize } = input
    let criteriaFilters: Filters | undefined
    let decodedCursor: Cursor | undefined

    if (filters && filters.length) {
      criteriaFilters = Filters.fromValues(filters)
      CriteriaValidator.validateFilters(criteriaFilters, allowedFilters)
    }

    // Cursor pagination requires a deterministic tie-breaker, so "id asc" is always appended.
    const idOrder = new Map([
      ['orderBy', 'id'],
      ['orderType', 'asc']
    ])
    const criteriaOrders = Orders.fromValues([...orders, idOrder])
    CriteriaValidator.validateOrders(criteriaOrders, allowedOrders)

    if (cursor) {
      decodedCursor = Cursor.decode(cursor, criteriaFilters, criteriaOrders)
    }

    return new Criteria({
      filters: criteriaFilters,
      orders: criteriaOrders,
      cursor: decodedCursor,
      limit: pageSize + 1
    })
  }

  static fromOffset(
    input: OffsetInput,
    allowedFilters: string[],
    allowedOrders: string[],
    searchableFields: string[] = []
  ): Criteria {
    const { filters, orders, search, page, pageSize } = input
    let criteriaFilters: Filters | undefined
    let criteriaOrders: Orders | undefined

    if (filters && filters.length) {
      criteriaFilters = Filters.fromValues(filters)
      CriteriaValidator.validateFilters(criteriaFilters, allowedFilters)
    }

    if (orders && orders.length) {
      criteriaOrders = Orders.fromValues(orders)
      CriteriaValidator.validateOrders(criteriaOrders, allowedOrders)
    }

    return new Criteria({
      filters: criteriaFilters,
      orders: criteriaOrders,
      search: Criteria.buildSearch(search, searchableFields),
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
  }

  // Same filter/order validation as fromOffset, but without limit/offset: matching returns every row.
  // Used by the export endpoints, which serialize the full filtered dataset (no pagination).
  static fromUnpaginated(
    input: UnpaginatedInput,
    allowedFilters: string[],
    allowedOrders: string[],
    searchableFields: string[] = []
  ): Criteria {
    const { filters, orders, search } = input
    let criteriaFilters: Filters | undefined
    let criteriaOrders: Orders | undefined

    if (filters && filters.length) {
      criteriaFilters = Filters.fromValues(filters)
      CriteriaValidator.validateFilters(criteriaFilters, allowedFilters)
    }

    if (orders && orders.length) {
      criteriaOrders = Orders.fromValues(orders)
      CriteriaValidator.validateOrders(criteriaOrders, allowedOrders)
    }

    return new Criteria({
      filters: criteriaFilters,
      orders: criteriaOrders,
      search: Criteria.buildSearch(search, searchableFields)
    })
  }

  // Añade un filtro impuesto por el servidor (no viene del cliente) a una criteria ya construida,
  // p.ej. acotar la búsqueda a status = 'active' por defecto. Devuelve una nueva Criteria (inmutable).
  withAdditionalFilter(filter: Filter): Criteria {
    const merged = new Filters([...(this.filters?.filters ?? []), filter])
    return new Criteria({
      filters: merged,
      orders: this.orders,
      search: this.search,
      cursor: this.cursor,
      offset: this.offset,
      limit: this.limit
    })
  }

  hasFilters(): boolean {
    return this.filters !== undefined && this.filters.filters.length > 0
  }

  hasOrders(): boolean {
    return this.orders !== undefined && this.orders.orders.length > 0
  }

  hasSearch(): boolean {
    return this.search !== undefined
  }
}
