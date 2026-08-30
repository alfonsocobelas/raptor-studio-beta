/** Bloqueo optimista (spec 78): el backend responde 409 con name ConcurrencyConflictError cuando la versión leída caducó. */
export const CONCURRENCY_CONFLICT_MESSAGE = 'Otro usuario ha modificado este registro. Recarga para ver los cambios.'

export function isConcurrencyConflict(error: unknown): boolean {
  return (error as { error?: { name?: string } })?.error?.name === 'ConcurrencyConflictError'
}
