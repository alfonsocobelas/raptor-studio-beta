import { Muestra } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra'
import { MuestraPrimitiveProps } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra-types'
import { MuestraBuilder } from './muestra.builder'

export class MuestraMother {
  static random(): Muestra {
    return MuestraBuilder.aMuestra().build()
  }

  static randomList(count: number = 5): Muestra[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<MuestraPrimitiveProps>): Muestra {
    return MuestraBuilder.aMuestra().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<MuestraPrimitiveProps>): Muestra {
    return MuestraBuilder.aMuestra().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<MuestraPrimitiveProps>): MuestraPrimitiveProps {
    return MuestraBuilder.aMuestra().withProps(overrides).build().toPrimitives()
  }
}
