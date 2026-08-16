import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { ClienteId } from '../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { ClienteAggregateProps, ClientePrimitiveProps, ClienteUpdateProps, RegisterClienteProps } from './cliente-types'
import { ClienteLocalidad } from './value-objects/cliente-localidad.vo'
import { ClienteNombre } from './value-objects/cliente-nombre.vo'
import { ClienteTelefono } from './value-objects/cliente-telefono.vo'
import { ClienteTipo } from './value-objects/cliente-tipo.vo'

export class Cliente extends AggregateRoot {
  private constructor(
    private readonly _id: ClienteId,
    private _nombre: ClienteNombre,
    private _tipo: ClienteTipo,
    private _telefono: ClienteTelefono,
    private _localidad: ClienteLocalidad
  ) {
    super()
  }

  //#region ...Getters...
  get id(): ClienteId {
    return this._id
  }
  get nombre(): ClienteNombre {
    return this._nombre
  }
  get tipo(): ClienteTipo {
    return this._tipo
  }
  get telefono(): ClienteTelefono {
    return this._telefono
  }
  get localidad(): ClienteLocalidad {
    return this._localidad
  }
  //#endregion

  static create(props: ClienteAggregateProps): Cliente {
    return new Cliente(props.id, props.nombre, props.tipo, props.telefono, props.localidad)
  }

  static register(props: RegisterClienteProps): Cliente {
    return Cliente.create({
      id: ClienteId.create(props.id),
      nombre: ClienteNombre.create(props.nombre),
      tipo: ClienteTipo.create(props.tipo),
      telefono: ClienteTelefono.create(props.telefono ?? ''),
      localidad: ClienteLocalidad.create(props.localidad ?? '')
    })
  }

  static fromPrimitives(props: ClientePrimitiveProps): Cliente {
    return new Cliente(
      ClienteId.create(props.id),
      ClienteNombre.create(props.nombre),
      ClienteTipo.create(props.tipo),
      ClienteTelefono.create(props.telefono),
      ClienteLocalidad.create(props.localidad)
    )
  }

  toPrimitives(): ClientePrimitiveProps {
    return {
      id: this._id.value,
      nombre: this._nombre.value,
      tipo: this._tipo.value,
      telefono: this._telefono.value,
      localidad: this._localidad.value
    }
  }

  updateDetails(updates: ClienteUpdateProps): void {
    if (updates.nombre !== undefined) {
      this._nombre = ClienteNombre.create(updates.nombre)
    }
    if (updates.tipo !== undefined) {
      this._tipo = ClienteTipo.create(updates.tipo)
    }
    if (updates.telefono !== undefined) {
      this._telefono = ClienteTelefono.create(updates.telefono)
    }
    if (updates.localidad !== undefined) {
      this._localidad = ClienteLocalidad.create(updates.localidad)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Cliente)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
