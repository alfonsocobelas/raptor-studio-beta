import { Cliente } from '../../../../../src/contexts/aguas/modules/clientes/domain/cliente'
import { ClientePrimitiveProps } from '../../../../../src/contexts/aguas/modules/clientes/domain/cliente-types'
import { ClienteBuilder } from './cliente.builder'

export class ClienteMother {
  static random(): Cliente {
    return ClienteBuilder.aCliente().build()
  }

  static randomList(count: number = 5): Cliente[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<ClientePrimitiveProps>): Cliente {
    return ClienteBuilder.aCliente().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<ClientePrimitiveProps>): Cliente {
    return ClienteBuilder.aCliente().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<ClientePrimitiveProps>): ClientePrimitiveProps {
    return ClienteBuilder.aCliente().withProps(overrides).build().toPrimitives()
  }
}
