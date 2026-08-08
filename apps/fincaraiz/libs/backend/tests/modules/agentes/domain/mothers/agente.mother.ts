import { Agente } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/agente'
import { AgentePrimitiveProps } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/agente-types'
import { AgenteBuilder } from './agente.builder'

export class AgenteMother {
  static random(): Agente {
    return AgenteBuilder.aAgente().build()
  }

  static randomList(count: number = 5): Agente[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<AgentePrimitiveProps>): Agente {
    return AgenteBuilder.aAgente().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<AgentePrimitiveProps>): Agente {
    return AgenteBuilder.aAgente().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<AgentePrimitiveProps>): AgentePrimitiveProps {
    return AgenteBuilder.aAgente().withProps(overrides).build().toPrimitives()
  }
}
