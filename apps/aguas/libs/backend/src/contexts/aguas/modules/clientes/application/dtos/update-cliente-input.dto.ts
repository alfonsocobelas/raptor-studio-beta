import { ClienteUpdateProps } from '../../domain/cliente-types'

export interface UpdateClienteInput {
  id: string
  updates: ClienteUpdateProps
}
