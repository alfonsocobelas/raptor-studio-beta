import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { MuestraId } from '../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { PuntoId } from '../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { MuestraAggregateProps, MuestraPrimitiveProps, MuestraUpdateProps, RegisterMuestraProps } from './muestra-types'
import { MuestraCodigo } from './value-objects/muestra-codigo.vo'
import { MuestraEstado } from './value-objects/muestra-estado.vo'
import { MuestraImporte } from './value-objects/muestra-importe.vo'
import { MuestraLimiteinforme } from './value-objects/muestra-limiteinforme.vo'
import { MuestraRecogida } from './value-objects/muestra-recogida.vo'
import { MuestraTecnico } from './value-objects/muestra-tecnico.vo'

export class Muestra extends AggregateRoot {
  private constructor(
    private readonly _id: MuestraId,
    private _codigo: MuestraCodigo,
    private _estado: MuestraEstado,
    private _tecnico: MuestraTecnico,
    private _recogida: MuestraRecogida,
    private _limiteInforme: MuestraLimiteinforme,
    private _importe: MuestraImporte,
    private _puntoId: PuntoId,
    private _puntoName: string
  ) {
    super()
  }

  //#region ...Getters...
  get id(): MuestraId {
    return this._id
  }
  get codigo(): MuestraCodigo {
    return this._codigo
  }
  get estado(): MuestraEstado {
    return this._estado
  }
  get tecnico(): MuestraTecnico {
    return this._tecnico
  }
  get recogida(): MuestraRecogida {
    return this._recogida
  }
  get limiteInforme(): MuestraLimiteinforme {
    return this._limiteInforme
  }
  get importe(): MuestraImporte {
    return this._importe
  }
  get puntoId(): PuntoId {
    return this._puntoId
  }
  get puntoName(): string {
    return this._puntoName
  }
  //#endregion

  static create(props: MuestraAggregateProps): Muestra {
    return new Muestra(
      props.id,
      props.codigo,
      props.estado,
      props.tecnico,
      props.recogida,
      props.limiteInforme,
      props.importe,
      props.puntoId,
      props.puntoName
    )
  }

  static register(props: RegisterMuestraProps): Muestra {
    return Muestra.create({
      id: MuestraId.create(props.id),
      codigo: MuestraCodigo.create(props.codigo),
      estado: MuestraEstado.create(props.estado),
      tecnico: MuestraTecnico.create(props.tecnico ?? ''),
      recogida: MuestraRecogida.create(props.recogida),
      limiteInforme: MuestraLimiteinforme.create(props.limiteInforme),
      importe: MuestraImporte.create(props.importe),
      puntoId: PuntoId.create(props.puntoId),
      puntoName: props.puntoName
    })
  }

  static fromPrimitives(props: MuestraPrimitiveProps): Muestra {
    return new Muestra(
      MuestraId.create(props.id),
      MuestraCodigo.create(props.codigo),
      MuestraEstado.create(props.estado),
      MuestraTecnico.create(props.tecnico),
      MuestraRecogida.create(props.recogida),
      MuestraLimiteinforme.create(props.limiteInforme),
      MuestraImporte.create(props.importe),
      PuntoId.create(props.puntoId),
      props.puntoName
    )
  }

  toPrimitives(): MuestraPrimitiveProps {
    return {
      id: this._id.value,
      codigo: this._codigo.value,
      estado: this._estado.value,
      tecnico: this._tecnico.value,
      recogida: this._recogida.value,
      limiteInforme: this._limiteInforme.value,
      importe: this._importe.value,
      puntoId: this._puntoId.value,
      puntoName: this._puntoName
    }
  }

  updateDetails(updates: MuestraUpdateProps): void {
    if (updates.codigo !== undefined) {
      this._codigo = MuestraCodigo.create(updates.codigo)
    }
    if (updates.estado !== undefined) {
      this._estado = MuestraEstado.create(updates.estado)
    }
    if (updates.tecnico !== undefined) {
      this._tecnico = MuestraTecnico.create(updates.tecnico)
    }
    if (updates.recogida !== undefined) {
      this._recogida = MuestraRecogida.create(updates.recogida)
    }
    if (updates.limiteInforme !== undefined) {
      this._limiteInforme = MuestraLimiteinforme.create(updates.limiteInforme)
    }
    if (updates.importe !== undefined) {
      this._importe = MuestraImporte.create(updates.importe)
    }
    if (updates.puntoId !== undefined) {
      this._puntoId = PuntoId.create(updates.puntoId)
    }
    if (updates.puntoName !== undefined) {
      this._puntoName = updates.puntoName
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Muestra)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
