import type { RegisterProjectProps } from '../../domain/project-types'

/**
 * customerName: copia desnormalizada del canon (spec 60).
 * No entra por el DTO — el use case la resuelve con un lookup por el FK y falla con 404
 * si el origen no existe.
 */
export type RegisterProjectInput = Omit<RegisterProjectProps, 'customerName'>
