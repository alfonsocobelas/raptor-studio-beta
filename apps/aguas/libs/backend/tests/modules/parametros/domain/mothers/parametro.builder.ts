import { v7 as uuidv7 } from 'uuid'
import { Parametro } from '../../../../../src/contexts/aguas/modules/parametros/domain/parametro'
import { ParametroPrimitiveProps } from '../../../../../src/contexts/aguas/modules/parametros/domain/parametro-types'
import { ParametroCodigo } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-codigo.vo'
import { ParametroLimitelegal } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-limitelegal.vo'
import { ParametroMetodo } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-metodo.vo'
import { ParametroNombre } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-nombre.vo'
import { ParametroPrecio } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-precio.vo'
import { ParametroId } from '../../../../../src/contexts/shared/domain/value-objects/parametros/parametro-id.vo'

export class ParametroBuilder {
  private props: ParametroPrimitiveProps = {
    id: uuidv7(),
    codigo: 'Codigo 1',
    nombre: '',
    metodo: '',
    limiteLegal: 0,
    precio: 0
  }

  static aParametro(): ParametroBuilder {
    return new ParametroBuilder()
  }

  withId(id: string): ParametroBuilder {
    this.props.id = id
    return this
  }

  withProps(overrides?: Partial<ParametroPrimitiveProps>): ParametroBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Parametro {
    return Parametro.create({
      id: ParametroId.create(this.props.id),
      codigo: ParametroCodigo.create(this.props.codigo),
      nombre: ParametroNombre.create(this.props.nombre),
      metodo: ParametroMetodo.create(this.props.metodo),
      limiteLegal: ParametroLimitelegal.create(this.props.limiteLegal),
      precio: ParametroPrecio.create(this.props.precio)
    })
  }

  build(): Parametro {
    return Parametro.fromPrimitives(this.props)
  }
}
