import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { ParametroId } from '../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import {
  ParametroAggregateProps,
  ParametroPrimitiveProps,
  ParametroUpdateProps,
  RegisterParametroProps
} from './parametro-types'
import { ParametroCodigo } from './value-objects/parametro-codigo.vo'
import { ParametroLimitelegal } from './value-objects/parametro-limitelegal.vo'
import { ParametroMetodo } from './value-objects/parametro-metodo.vo'
import { ParametroNombre } from './value-objects/parametro-nombre.vo'
import { ParametroPrecio } from './value-objects/parametro-precio.vo'

export class Parametro extends AggregateRoot {
  private constructor(
    private readonly _id: ParametroId,
    private _codigo: ParametroCodigo,
    private _nombre: ParametroNombre,
    private _metodo: ParametroMetodo,
    private _limiteLegal: ParametroLimitelegal,
    private _precio: ParametroPrecio
  ) {
    super()
  }

  //#region ...Getters...
  get id(): ParametroId {
    return this._id
  }
  get codigo(): ParametroCodigo {
    return this._codigo
  }
  get nombre(): ParametroNombre {
    return this._nombre
  }
  get metodo(): ParametroMetodo {
    return this._metodo
  }
  get limiteLegal(): ParametroLimitelegal {
    return this._limiteLegal
  }
  get precio(): ParametroPrecio {
    return this._precio
  }
  //#endregion

  static create(props: ParametroAggregateProps): Parametro {
    return new Parametro(props.id, props.codigo, props.nombre, props.metodo, props.limiteLegal, props.precio)
  }

  static register(props: RegisterParametroProps): Parametro {
    return Parametro.create({
      id: ParametroId.create(props.id),
      codigo: ParametroCodigo.create(props.codigo),
      nombre: ParametroNombre.create(props.nombre ?? ''),
      metodo: ParametroMetodo.create(props.metodo ?? ''),
      limiteLegal: ParametroLimitelegal.create(props.limiteLegal),
      precio: ParametroPrecio.create(props.precio)
    })
  }

  static fromPrimitives(props: ParametroPrimitiveProps): Parametro {
    return new Parametro(
      ParametroId.create(props.id),
      ParametroCodigo.create(props.codigo),
      ParametroNombre.create(props.nombre),
      ParametroMetodo.create(props.metodo),
      ParametroLimitelegal.create(props.limiteLegal),
      ParametroPrecio.create(props.precio)
    )
  }

  toPrimitives(): ParametroPrimitiveProps {
    return {
      id: this._id.value,
      codigo: this._codigo.value,
      nombre: this._nombre.value,
      metodo: this._metodo.value,
      limiteLegal: this._limiteLegal.value,
      precio: this._precio.value
    }
  }

  updateDetails(updates: ParametroUpdateProps): void {
    if (updates.codigo !== undefined) {
      this._codigo = ParametroCodigo.create(updates.codigo)
    }
    if (updates.nombre !== undefined) {
      this._nombre = ParametroNombre.create(updates.nombre)
    }
    if (updates.metodo !== undefined) {
      this._metodo = ParametroMetodo.create(updates.metodo)
    }
    if (updates.limiteLegal !== undefined) {
      this._limiteLegal = ParametroLimitelegal.create(updates.limiteLegal)
    }
    if (updates.precio !== undefined) {
      this._precio = ParametroPrecio.create(updates.precio)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Parametro)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
