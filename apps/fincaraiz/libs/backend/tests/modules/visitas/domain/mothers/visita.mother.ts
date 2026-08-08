import { Visita } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/visita'
import { VisitaPrimitiveProps } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/visita-types'
import { VisitaBuilder } from './visita.builder'

export class VisitaMother {
  static random(): Visita {
    return VisitaBuilder.aVisita().build()
  }

  static randomList(count: number = 5): Visita[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<VisitaPrimitiveProps>): Visita {
    return VisitaBuilder.aVisita().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<VisitaPrimitiveProps>): Visita {
    return VisitaBuilder.aVisita().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<VisitaPrimitiveProps>): VisitaPrimitiveProps {
    return VisitaBuilder.aVisita().withProps(overrides).build().toPrimitives()
  }
}
