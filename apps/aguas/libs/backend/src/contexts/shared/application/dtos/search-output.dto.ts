import { Nullable } from '../../domain/types'

export interface OffsetPaginatedOutput<T> {
  readonly total: number
  readonly page: number
  readonly pageSize: number
  readonly totalPages: number
  readonly items: T[]
}

export interface CursorPaginatedOutput<T> {
  readonly nextCursor: Nullable<string>
  readonly hasMore: boolean
  readonly items: T[]
}
