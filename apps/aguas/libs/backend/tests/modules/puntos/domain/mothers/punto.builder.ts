import { v7 as uuidv7 } from 'uuid'
import { Punto } from '../../../../../src/contexts/aguas/modules/puntos/domain/punto'
import { PuntoPrimitiveProps } from '../../../../../src/contexts/aguas/modules/puntos/domain/punto-types'
import { PuntoCoordenadas } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-coordenadas.vo'
import { PuntoDireccion } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-direccion.vo'
import { PuntoNombre } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-nombre.vo'
import { PuntoObligatorio } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-obligatorio.vo'
import { PuntoTipoagua } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-tipoagua.vo'
import { PuntoId } from '../../../../../src/contexts/shared/domain/value-objects/puntos/punto-id.vo'
import { ClienteId } from '../../../../../src/contexts/shared/domain/value-objects/clientes/cliente-id.vo'

export class PuntoBuilder {
  private props: PuntoPrimitiveProps = {
    id: uuidv7(),
    nombre: 'Nombre 1',
    tipoAgua: 'potable',
    direccion: '',
    coordenadas: '',
    obligatorio: false,
    clienteId: uuidv7(),
    clienteName: 'ClienteName 1'
  }

  static aPunto(): PuntoBuilder {
    return new PuntoBuilder()
  }

  withId(id: string): PuntoBuilder {
    this.props.id = id
    return this
  }

  withTipoAgua(tipoAgua: string): PuntoBuilder {
    this.props.tipoAgua = tipoAgua
    return this
  }

  withClienteId(clienteId: string): PuntoBuilder {
    this.props.clienteId = clienteId
    return this
  }

  withProps(overrides?: Partial<PuntoPrimitiveProps>): PuntoBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Punto {
    return Punto.create({
      id: PuntoId.create(this.props.id),
      nombre: PuntoNombre.create(this.props.nombre),
      tipoAgua: PuntoTipoagua.create(this.props.tipoAgua),
      direccion: PuntoDireccion.create(this.props.direccion),
      coordenadas: PuntoCoordenadas.create(this.props.coordenadas),
      obligatorio: PuntoObligatorio.create(this.props.obligatorio),
      clienteId: ClienteId.create(this.props.clienteId),
      clienteName: this.props.clienteName
    })
  }

  build(): Punto {
    return Punto.fromPrimitives(this.props)
  }
}
