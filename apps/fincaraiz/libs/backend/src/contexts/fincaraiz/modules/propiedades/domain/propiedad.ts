import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { PropiedadId } from '../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { AgenteId } from '../../../../shared/domain/value-objects/agentes/agente-id.vo'
import {
  PropiedadAggregateProps,
  PropiedadPrimitiveProps,
  PropiedadUpdateProps,
  RegisterPropiedadProps
} from './propiedad-types'
import { PropiedadEstado } from './value-objects/propiedad-estado.vo'
import { PropiedadExclusiva } from './value-objects/propiedad-exclusiva.vo'
import { PropiedadFechaalta } from './value-objects/propiedad-fechaalta.vo'
import { PropiedadHabitaciones } from './value-objects/propiedad-habitaciones.vo'
import { PropiedadMetroscuadrados } from './value-objects/propiedad-metroscuadrados.vo'
import { PropiedadPrecio } from './value-objects/propiedad-precio.vo'
import { PropiedadTitulo } from './value-objects/propiedad-titulo.vo'
import { PropiedadZona } from './value-objects/propiedad-zona.vo'

export class Propiedad extends AggregateRoot {
  private constructor(
    private readonly _id: PropiedadId,
    private _titulo: PropiedadTitulo,
    private _zona: PropiedadZona,
    private _estado: PropiedadEstado,
    private _metrosCuadrados: PropiedadMetroscuadrados,
    private _habitaciones: PropiedadHabitaciones,
    private _precio: PropiedadPrecio,
    private _fechaAlta: PropiedadFechaalta,
    private _exclusiva: PropiedadExclusiva,
    private _agenteId: AgenteId,
    private _agenteName: string
  ) {
    super()
  }

  //#region ...Getters...
  get id(): PropiedadId {
    return this._id
  }
  get titulo(): PropiedadTitulo {
    return this._titulo
  }
  get zona(): PropiedadZona {
    return this._zona
  }
  get estado(): PropiedadEstado {
    return this._estado
  }
  get metrosCuadrados(): PropiedadMetroscuadrados {
    return this._metrosCuadrados
  }
  get habitaciones(): PropiedadHabitaciones {
    return this._habitaciones
  }
  get precio(): PropiedadPrecio {
    return this._precio
  }
  get fechaAlta(): PropiedadFechaalta {
    return this._fechaAlta
  }
  get exclusiva(): PropiedadExclusiva {
    return this._exclusiva
  }
  get agenteId(): AgenteId {
    return this._agenteId
  }
  get agenteName(): string {
    return this._agenteName
  }
  //#endregion

  static create(props: PropiedadAggregateProps): Propiedad {
    return new Propiedad(
      props.id,
      props.titulo,
      props.zona,
      props.estado,
      props.metrosCuadrados,
      props.habitaciones,
      props.precio,
      props.fechaAlta,
      props.exclusiva,
      props.agenteId,
      props.agenteName
    )
  }

  static register(props: RegisterPropiedadProps): Propiedad {
    return Propiedad.create({
      id: PropiedadId.create(props.id),
      titulo: PropiedadTitulo.create(props.titulo),
      zona: PropiedadZona.create(props.zona ?? ''),
      estado: PropiedadEstado.create(props.estado),
      metrosCuadrados: PropiedadMetroscuadrados.create(props.metrosCuadrados),
      habitaciones: PropiedadHabitaciones.create(props.habitaciones),
      precio: PropiedadPrecio.create(props.precio),
      fechaAlta: PropiedadFechaalta.create(props.fechaAlta),
      exclusiva: PropiedadExclusiva.create(props.exclusiva),
      agenteId: AgenteId.create(props.agenteId),
      agenteName: props.agenteName
    })
  }

  static fromPrimitives(props: PropiedadPrimitiveProps): Propiedad {
    return new Propiedad(
      PropiedadId.create(props.id),
      PropiedadTitulo.create(props.titulo),
      PropiedadZona.create(props.zona),
      PropiedadEstado.create(props.estado),
      PropiedadMetroscuadrados.create(props.metrosCuadrados),
      PropiedadHabitaciones.create(props.habitaciones),
      PropiedadPrecio.create(props.precio),
      PropiedadFechaalta.create(props.fechaAlta),
      PropiedadExclusiva.create(props.exclusiva),
      AgenteId.create(props.agenteId),
      props.agenteName
    )
  }

  toPrimitives(): PropiedadPrimitiveProps {
    return {
      id: this._id.value,
      titulo: this._titulo.value,
      zona: this._zona.value,
      estado: this._estado.value,
      metrosCuadrados: this._metrosCuadrados.value,
      habitaciones: this._habitaciones.value,
      precio: this._precio.value,
      fechaAlta: this._fechaAlta.value,
      exclusiva: this._exclusiva.value,
      agenteId: this._agenteId.value,
      agenteName: this._agenteName
    }
  }

  updateDetails(updates: PropiedadUpdateProps): void {
    if (updates.titulo !== undefined) {
      this._titulo = PropiedadTitulo.create(updates.titulo)
    }
    if (updates.zona !== undefined) {
      this._zona = PropiedadZona.create(updates.zona)
    }
    if (updates.estado !== undefined) {
      this._estado = PropiedadEstado.create(updates.estado)
    }
    if (updates.metrosCuadrados !== undefined) {
      this._metrosCuadrados = PropiedadMetroscuadrados.create(updates.metrosCuadrados)
    }
    if (updates.habitaciones !== undefined) {
      this._habitaciones = PropiedadHabitaciones.create(updates.habitaciones)
    }
    if (updates.precio !== undefined) {
      this._precio = PropiedadPrecio.create(updates.precio)
    }
    if (updates.fechaAlta !== undefined) {
      this._fechaAlta = PropiedadFechaalta.create(updates.fechaAlta)
    }
    if (updates.exclusiva !== undefined) {
      this._exclusiva = PropiedadExclusiva.create(updates.exclusiva)
    }
    if (updates.agenteId !== undefined) {
      this._agenteId = AgenteId.create(updates.agenteId)
    }
    if (updates.agenteName !== undefined) {
      this._agenteName = updates.agenteName
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Propiedad)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
