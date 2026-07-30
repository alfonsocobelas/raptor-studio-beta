interface PaginationParams {
  readonly pageSize: number
  readonly total: number
}

export function getTotalPages(params: PaginationParams): number {
  return Math.ceil(params.total / params.pageSize)
}
