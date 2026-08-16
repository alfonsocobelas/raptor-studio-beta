/** Forma de la respuesta paginada que devuelven todos los listados de la API. */
export interface OffsetPaginatedOutput<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
