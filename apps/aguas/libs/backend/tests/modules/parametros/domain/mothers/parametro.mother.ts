import { Parametro } from '../../../../../src/contexts/aguas/modules/parametros/domain/parametro'
import { ParametroPrimitiveProps } from '../../../../../src/contexts/aguas/modules/parametros/domain/parametro-types'
import { ParametroBuilder } from './parametro.builder'

export class ParametroMother {
  static random(): Parametro {
    return ParametroBuilder.aParametro().build()
  }

  static randomList(count: number = 5): Parametro[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<ParametroPrimitiveProps>): Parametro {
    return ParametroBuilder.aParametro().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<ParametroPrimitiveProps>): Parametro {
    return ParametroBuilder.aParametro().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<ParametroPrimitiveProps>): ParametroPrimitiveProps {
    return ParametroBuilder.aParametro().withProps(overrides).build().toPrimitives()
  }
}
