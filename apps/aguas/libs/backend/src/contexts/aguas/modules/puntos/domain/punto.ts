import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { PuntoId } from '../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { ClienteId } from '../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { PuntoAggregateProps, PuntoPrimitiveProps, PuntoUpdateProps, RegisterPuntoProps } from './punto-types'
import { PuntoCoordenadas } from './value-objects/punto-coordenadas.vo'
import { PuntoDireccion } from './value-objects/punto-direccion.vo'
import { PuntoNombre } from './value-objects/punto-nombre.vo'
import { PuntoObligatorio } from './value-objects/punto-obligatorio.vo'
import { PuntoTipoagua } from './value-objects/punto-tipoagua.vo'

export class Punto extends AggregateRoot {
  private constructor(
    private readonly _id: PuntoId,
    private _nombre: PuntoNombre,
    private _tipoAgua: PuntoTipoagua,
    private _direccion: PuntoDireccion,
    private _coordenadas: PuntoCoordenadas,
    private _obligatorio: PuntoObligatorio,
    private _clienteId: ClienteId,
    private _clienteName: string
  ) {
    super()
  }

  //#region ...Getters...
  get id(): PuntoId {
    return this._id
  }
  get nombre(): PuntoNombre {
    return this._nombre
  }
  get tipoAgua(): PuntoTipoagua {
    return this._tipoAgua
  }
  get direccion(): PuntoDireccion {
    return this._direccion
  }
  get coordenadas(): PuntoCoordenadas {
    return this._coordenadas
  }
  get obligatorio(): PuntoObligatorio {
    return this._obligatorio
  }
  get clienteId(): ClienteId {
    return this._clienteId
  }
  get clienteName(): string {
    return this._clienteName
  }
  //#endregion

  static create(props: PuntoAggregateProps): Punto {
    return new Punto(
      props.id,
      props.nombre,
      props.tipoAgua,
      props.direccion,
      props.coordenadas,
      props.obligatorio,
      props.clienteId,
      props.clienteName
    )
  }

  static register(props: RegisterPuntoProps): Punto {
    return Punto.create({
      id: PuntoId.create(props.id),
      nombre: PuntoNombre.create(props.nombre),
      tipoAgua: PuntoTipoagua.create(props.tipoAgua),
      direccion: PuntoDireccion.create(props.direccion ?? ''),
      coordenadas: PuntoCoordenadas.create(props.coordenadas ?? ''),
      obligatorio: PuntoObligatorio.create(props.obligatorio),
      clienteId: ClienteId.create(props.clienteId),
      clienteName: props.clienteName
    })
  }

  static fromPrimitives(props: PuntoPrimitiveProps): Punto {
    return new Punto(
      PuntoId.create(props.id),
      PuntoNombre.create(props.nombre),
      PuntoTipoagua.create(props.tipoAgua),
      PuntoDireccion.create(props.direccion),
      PuntoCoordenadas.create(props.coordenadas),
      PuntoObligatorio.create(props.obligatorio),
      ClienteId.create(props.clienteId),
      props.clienteName
    )
  }

  toPrimitives(): PuntoPrimitiveProps {
    return {
      id: this._id.value,
      nombre: this._nombre.value,
      tipoAgua: this._tipoAgua.value,
      direccion: this._direccion.value,
      coordenadas: this._coordenadas.value,
      obligatorio: this._obligatorio.value,
      clienteId: this._clienteId.value,
      clienteName: this._clienteName
    }
  }

  updateDetails(updates: PuntoUpdateProps): void {
    if (updates.nombre !== undefined) {
      this._nombre = PuntoNombre.create(updates.nombre)
    }
    if (updates.tipoAgua !== undefined) {
      this._tipoAgua = PuntoTipoagua.create(updates.tipoAgua)
    }
    if (updates.direccion !== undefined) {
      this._direccion = PuntoDireccion.create(updates.direccion)
    }
    if (updates.coordenadas !== undefined) {
      this._coordenadas = PuntoCoordenadas.create(updates.coordenadas)
    }
    if (updates.obligatorio !== undefined) {
      this._obligatorio = PuntoObligatorio.create(updates.obligatorio)
    }
    if (updates.clienteId !== undefined) {
      this._clienteId = ClienteId.create(updates.clienteId)
    }
    if (updates.clienteName !== undefined) {
      this._clienteName = updates.clienteName
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Punto)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
