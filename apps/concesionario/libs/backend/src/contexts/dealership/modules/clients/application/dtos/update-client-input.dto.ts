import { ClientUpdateProps } from '../../domain/client-types'

export interface UpdateClientInput {
  id: string
  updates: ClientUpdateProps
}
