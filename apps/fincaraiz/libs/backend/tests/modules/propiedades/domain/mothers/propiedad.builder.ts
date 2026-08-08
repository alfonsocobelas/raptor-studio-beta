import { v7 as uuidv7 } from 'uuid'
import { Propiedad } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad'
import { PropiedadPrimitiveProps } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad-types'
import { PropiedadEstado } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-estado.vo'
import { PropiedadExclusiva } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-exclusiva.vo'
import { PropiedadFechaalta } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-fechaalta.vo'
import { PropiedadHabitaciones } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-habitaciones.vo'
import { PropiedadMetroscuadrados } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-metroscuadrados.vo'
import { PropiedadPrecio } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-precio.vo'
import { PropiedadTitulo } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-titulo.vo'
import { PropiedadZona } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-zona.vo'
import { PropiedadId } from '../../../../../src/contexts/shared/domain/value-objects/propiedades/propiedad-id.vo'
import { AgenteId } from '../../../../../src/contexts/shared/domain/value-objects/agentes/agente-id.vo'

export class PropiedadBuilder {
  private props: PropiedadPrimitiveProps = {
    id: uuidv7(),
    titulo: 'Titulo 1',
    zona: '',
    estado: 'disponible',
    metrosCuadrados: 0,
    habitaciones: 0,
    precio: 0,
    fechaAlta: '2026-01-15',
    exclusiva: false,
    agenteId: uuidv7(),
    agenteName: 'AgenteName 1'
  }

  static aPropiedad(): PropiedadBuilder {
    return new PropiedadBuilder()
  }

  withId(id: string): PropiedadBuilder {
    this.props.id = id
    return this
  }

  withEstado(estado: string): PropiedadBuilder {
    this.props.estado = estado
    return this
  }

  withAgenteId(agenteId: string): PropiedadBuilder {
    this.props.agenteId = agenteId
    return this
  }

  withProps(overrides?: Partial<PropiedadPrimitiveProps>): PropiedadBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Propiedad {
    return Propiedad.create({
      id: PropiedadId.create(this.props.id),
      titulo: PropiedadTitulo.create(this.props.titulo),
      zona: PropiedadZona.create(this.props.zona),
      estado: PropiedadEstado.create(this.props.estado),
      metrosCuadrados: PropiedadMetroscuadrados.create(this.props.metrosCuadrados),
      habitaciones: PropiedadHabitaciones.create(this.props.habitaciones),
      precio: PropiedadPrecio.create(this.props.precio),
      fechaAlta: PropiedadFechaalta.create(this.props.fechaAlta),
      exclusiva: PropiedadExclusiva.create(this.props.exclusiva),
      agenteId: AgenteId.create(this.props.agenteId),
      agenteName: this.props.agenteName
    })
  }

  build(): Propiedad {
    return Propiedad.fromPrimitives(this.props)
  }
}
