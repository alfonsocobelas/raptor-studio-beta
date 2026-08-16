import { Punto } from '../../../../../src/contexts/aguas/modules/puntos/domain/punto'
import { PuntoPrimitiveProps } from '../../../../../src/contexts/aguas/modules/puntos/domain/punto-types'
import { PuntoBuilder } from './punto.builder'

export class PuntoMother {
  static random(): Punto {
    return PuntoBuilder.aPunto().build()
  }

  static randomList(count: number = 5): Punto[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<PuntoPrimitiveProps>): Punto {
    return PuntoBuilder.aPunto().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<PuntoPrimitiveProps>): Punto {
    return PuntoBuilder.aPunto().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<PuntoPrimitiveProps>): PuntoPrimitiveProps {
    return PuntoBuilder.aPunto().withProps(overrides).build().toPrimitives()
  }
}
