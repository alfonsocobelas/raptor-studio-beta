import { v7 as uuidv7 } from 'uuid'
import { Agente } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/agente'
import { AgentePrimitiveProps } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/agente-types'
import { AgenteActivo } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-activo.vo'
import { AgenteComisionporcentaje } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-comisionporcentaje.vo'
import { AgenteEmail } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-email.vo'
import { AgenteNombre } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-nombre.vo'
import { AgenteTelefono } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-telefono.vo'
import { AgenteId } from '../../../../../src/contexts/shared/domain/value-objects/agentes/agente-id.vo'

export class AgenteBuilder {
  private props: AgentePrimitiveProps = {
    id: uuidv7(),
    nombre: 'Nombre 1',
    email: '',
    telefono: '',
    comisionPorcentaje: 0,
    activo: false
  }

  static aAgente(): AgenteBuilder {
    return new AgenteBuilder()
  }

  withId(id: string): AgenteBuilder {
    this.props.id = id
    return this
  }

  withProps(overrides?: Partial<AgentePrimitiveProps>): AgenteBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Agente {
    return Agente.create({
      id: AgenteId.create(this.props.id),
      nombre: AgenteNombre.create(this.props.nombre),
      email: AgenteEmail.create(this.props.email),
      telefono: AgenteTelefono.create(this.props.telefono),
      comisionPorcentaje: AgenteComisionporcentaje.create(this.props.comisionPorcentaje),
      activo: AgenteActivo.create(this.props.activo)
    })
  }

  build(): Agente {
    return Agente.fromPrimitives(this.props)
  }
}
