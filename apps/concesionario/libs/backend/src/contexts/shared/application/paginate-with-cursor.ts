import { Criteria } from '../domain/query/criteria'
import { Cursor, CursorPosition, CursorValue } from '../domain/query/cursor'
import { CursorPaginatedOutput } from './dtos/search-output.dto'

interface CursorRepository<T> {
  matching: (criteria: Criteria) => Promise<T[]>
}

// Cursor pagination: the repository is asked for pageSize + 1 rows (Criteria.fromCursor already
// sets that limit). If the extra row comes back there is another page, and the last returned row's
// order-column values become the next cursor. mapFn must expose every ORDER BY field as a key.
export async function paginateWithCursor<T, K>(
  criteria: Criteria,
  repository: CursorRepository<T>,
  pageSize: number,
  mapFn: (item: T) => K
): Promise<CursorPaginatedOutput<K>> {
  const rows = await repository.matching(criteria)

  const hasMore = rows.length > pageSize
  if (hasMore) {
    rows.pop()
  }

  const items = rows.map(mapFn)
  const lastItem = items[items.length - 1]

  if (!lastItem) {
    return { nextCursor: null, hasMore: false, items: [] }
  }

  const lastFields = lastItem as Record<string, CursorValue>
  const orders = criteria.orders?.orders ?? []
  const position: CursorPosition = orders.map(order => ({
    field: order.orderBy.value,
    value: lastFields[order.orderBy.value]
  }))

  const nextCursor = Cursor.encode(position, criteria.filters, criteria.orders)

  return { nextCursor, hasMore, items }
}
