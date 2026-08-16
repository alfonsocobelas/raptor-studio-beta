import { v7 as uuidv7 } from 'uuid'
import { Cliente } from '../../../../../src/contexts/aguas/modules/clientes/domain/cliente'
import { ClientePrimitiveProps } from '../../../../../src/contexts/aguas/modules/clientes/domain/cliente-types'
import { ClienteLocalidad } from '../../../../../src/contexts/aguas/modules/clientes/domain/value-objects/cliente-localidad.vo'
import { ClienteNombre } from '../../../../../src/contexts/aguas/modules/clientes/domain/value-objects/cliente-nombre.vo'
import { ClienteTelefono } from '../../../../../src/contexts/aguas/modules/clientes/domain/value-objects/cliente-telefono.vo'
import { ClienteTipo } from '../../../../../src/contexts/aguas/modules/clientes/domain/value-objects/cliente-tipo.vo'
import { ClienteId } from '../../../../../src/contexts/shared/domain/value-objects/clientes/cliente-id.vo'

export class ClienteBuilder {
  private props: ClientePrimitiveProps = {
    id: uuidv7(),
    nombre: 'Nombre 1',
    tipo: 'ayuntamiento',
    telefono: '',
    localidad: ''
  }

  static aCliente(): ClienteBuilder {
    return new ClienteBuilder()
  }

  withId(id: string): ClienteBuilder {
    this.props.id = id
    return this
  }

  withTipo(tipo: string): ClienteBuilder {
    this.props.tipo = tipo
    return this
  }

  withProps(overrides?: Partial<ClientePrimitiveProps>): ClienteBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Cliente {
    return Cliente.create({
      id: ClienteId.create(this.props.id),
      nombre: ClienteNombre.create(this.props.nombre),
      tipo: ClienteTipo.create(this.props.tipo),
      telefono: ClienteTelefono.create(this.props.telefono),
      localidad: ClienteLocalidad.create(this.props.localidad)
    })
  }

  build(): Cliente {
    return Cliente.fromPrimitives(this.props)
  }
}
