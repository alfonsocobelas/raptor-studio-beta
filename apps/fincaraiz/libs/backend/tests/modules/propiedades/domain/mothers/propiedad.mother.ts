import { Propiedad } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad'
import { PropiedadPrimitiveProps } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad-types'
import { PropiedadBuilder } from './propiedad.builder'

export class PropiedadMother {
  static random(): Propiedad {
    return PropiedadBuilder.aPropiedad().build()
  }

  static randomList(count: number = 5): Propiedad[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<PropiedadPrimitiveProps>): Propiedad {
    return PropiedadBuilder.aPropiedad().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<PropiedadPrimitiveProps>): Propiedad {
    return PropiedadBuilder.aPropiedad().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<PropiedadPrimitiveProps>): PropiedadPrimitiveProps {
    return PropiedadBuilder.aPropiedad().withProps(overrides).build().toPrimitives()
  }
}
