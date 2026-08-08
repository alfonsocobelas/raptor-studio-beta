import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { AgenteId } from '../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { AgenteAggregateProps, AgentePrimitiveProps, AgenteUpdateProps, RegisterAgenteProps } from './agente-types'
import { AgenteActivo } from './value-objects/agente-activo.vo'
import { AgenteComisionporcentaje } from './value-objects/agente-comisionporcentaje.vo'
import { AgenteEmail } from './value-objects/agente-email.vo'
import { AgenteNombre } from './value-objects/agente-nombre.vo'
import { AgenteTelefono } from './value-objects/agente-telefono.vo'

export class Agente extends AggregateRoot {
  private constructor(
    private readonly _id: AgenteId,
    private _nombre: AgenteNombre,
    private _email: AgenteEmail,
    private _telefono: AgenteTelefono,
    private _comisionPorcentaje: AgenteComisionporcentaje,
    private _activo: AgenteActivo
  ) {
    super()
  }

  //#region ...Getters...
  get id(): AgenteId {
    return this._id
  }
  get nombre(): AgenteNombre {
    return this._nombre
  }
  get email(): AgenteEmail {
    return this._email
  }
  get telefono(): AgenteTelefono {
    return this._telefono
  }
  get comisionPorcentaje(): AgenteComisionporcentaje {
    return this._comisionPorcentaje
  }
  get activo(): AgenteActivo {
    return this._activo
  }
  //#endregion

  static create(props: AgenteAggregateProps): Agente {
    return new Agente(props.id, props.nombre, props.email, props.telefono, props.comisionPorcentaje, props.activo)
  }

  static register(props: RegisterAgenteProps): Agente {
    return Agente.create({
      id: AgenteId.create(props.id),
      nombre: AgenteNombre.create(props.nombre),
      email: AgenteEmail.create(props.email ?? ''),
      telefono: AgenteTelefono.create(props.telefono ?? ''),
      comisionPorcentaje: AgenteComisionporcentaje.create(props.comisionPorcentaje),
      activo: AgenteActivo.create(props.activo)
    })
  }

  static fromPrimitives(props: AgentePrimitiveProps): Agente {
    return new Agente(
      AgenteId.create(props.id),
      AgenteNombre.create(props.nombre),
      AgenteEmail.create(props.email),
      AgenteTelefono.create(props.telefono),
      AgenteComisionporcentaje.create(props.comisionPorcentaje),
      AgenteActivo.create(props.activo)
    )
  }

  toPrimitives(): AgentePrimitiveProps {
    return {
      id: this._id.value,
      nombre: this._nombre.value,
      email: this._email.value,
      telefono: this._telefono.value,
      comisionPorcentaje: this._comisionPorcentaje.value,
      activo: this._activo.value
    }
  }

  updateDetails(updates: AgenteUpdateProps): void {
    if (updates.nombre !== undefined) {
      this._nombre = AgenteNombre.create(updates.nombre)
    }
    if (updates.email !== undefined) {
      this._email = AgenteEmail.create(updates.email)
    }
    if (updates.telefono !== undefined) {
      this._telefono = AgenteTelefono.create(updates.telefono)
    }
    if (updates.comisionPorcentaje !== undefined) {
      this._comisionPorcentaje = AgenteComisionporcentaje.create(updates.comisionPorcentaje)
    }
    if (updates.activo !== undefined) {
      this._activo = AgenteActivo.create(updates.activo)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Agente)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
