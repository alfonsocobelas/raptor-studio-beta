import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { VisitaId } from '../../../../shared/domain/value-objects/visitas/visita-id.vo'
import { PropiedadId } from '../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { RegisterVisitaProps, VisitaAggregateProps, VisitaPrimitiveProps, VisitaUpdateProps } from './visita-types'
import { VisitaConfirmada } from './value-objects/visita-confirmada.vo'
import { VisitaFecha } from './value-objects/visita-fecha.vo'
import { VisitaInteresado } from './value-objects/visita-interesado.vo'
import { VisitaObservaciones } from './value-objects/visita-observaciones.vo'
import { VisitaReferencia } from './value-objects/visita-referencia.vo'

export class Visita extends AggregateRoot {
  private constructor(
    private readonly _id: VisitaId,
    private _referencia: VisitaReferencia,
    private _fecha: VisitaFecha,
    private _interesado: VisitaInteresado,
    private _observaciones: VisitaObservaciones,
    private _confirmada: VisitaConfirmada,
    private _propiedadId: PropiedadId,
    private _propiedadName: string
  ) {
    super()
  }

  //#region ...Getters...
  get id(): VisitaId {
    return this._id
  }
  get referencia(): VisitaReferencia {
    return this._referencia
  }
  get fecha(): VisitaFecha {
    return this._fecha
  }
  get interesado(): VisitaInteresado {
    return this._interesado
  }
  get observaciones(): VisitaObservaciones {
    return this._observaciones
  }
  get confirmada(): VisitaConfirmada {
    return this._confirmada
  }
  get propiedadId(): PropiedadId {
    return this._propiedadId
  }
  get propiedadName(): string {
    return this._propiedadName
  }
  //#endregion

  static create(props: VisitaAggregateProps): Visita {
    return new Visita(
      props.id,
      props.referencia,
      props.fecha,
      props.interesado,
      props.observaciones,
      props.confirmada,
      props.propiedadId,
      props.propiedadName
    )
  }

  static register(props: RegisterVisitaProps): Visita {
    return Visita.create({
      id: VisitaId.create(props.id),
      referencia: VisitaReferencia.create(props.referencia),
      fecha: VisitaFecha.create(props.fecha),
      interesado: VisitaInteresado.create(props.interesado ?? ''),
      observaciones: VisitaObservaciones.create(props.observaciones ?? ''),
      confirmada: VisitaConfirmada.create(props.confirmada),
      propiedadId: PropiedadId.create(props.propiedadId),
      propiedadName: props.propiedadName
    })
  }

  static fromPrimitives(props: VisitaPrimitiveProps): Visita {
    return new Visita(
      VisitaId.create(props.id),
      VisitaReferencia.create(props.referencia),
      VisitaFecha.create(props.fecha),
      VisitaInteresado.create(props.interesado),
      VisitaObservaciones.create(props.observaciones),
      VisitaConfirmada.create(props.confirmada),
      PropiedadId.create(props.propiedadId),
      props.propiedadName
    )
  }

  toPrimitives(): VisitaPrimitiveProps {
    return {
      id: this._id.value,
      referencia: this._referencia.value,
      fecha: this._fecha.value,
      interesado: this._interesado.value,
      observaciones: this._observaciones.value,
      confirmada: this._confirmada.value,
      propiedadId: this._propiedadId.value,
      propiedadName: this._propiedadName
    }
  }

  updateDetails(updates: VisitaUpdateProps): void {
    if (updates.referencia !== undefined) {
      this._referencia = VisitaReferencia.create(updates.referencia)
    }
    if (updates.fecha !== undefined) {
      this._fecha = VisitaFecha.create(updates.fecha)
    }
    if (updates.interesado !== undefined) {
      this._interesado = VisitaInteresado.create(updates.interesado)
    }
    if (updates.observaciones !== undefined) {
      this._observaciones = VisitaObservaciones.create(updates.observaciones)
    }
    if (updates.confirmada !== undefined) {
      this._confirmada = VisitaConfirmada.create(updates.confirmada)
    }
    if (updates.propiedadId !== undefined) {
      this._propiedadId = PropiedadId.create(updates.propiedadId)
    }
    if (updates.propiedadName !== undefined) {
      this._propiedadName = updates.propiedadName
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Visita)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
