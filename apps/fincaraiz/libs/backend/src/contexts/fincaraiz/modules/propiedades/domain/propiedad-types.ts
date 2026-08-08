import { Nullable } from '../../../../shared/domain/types'
import { PropiedadId } from '../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { AgenteId } from '../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { PropiedadEstado } from './value-objects/propiedad-estado.vo'
import { PropiedadExclusiva } from './value-objects/propiedad-exclusiva.vo'
import { PropiedadFechaalta } from './value-objects/propiedad-fechaalta.vo'
import { PropiedadHabitaciones } from './value-objects/propiedad-habitaciones.vo'
import { PropiedadMetroscuadrados } from './value-objects/propiedad-metroscuadrados.vo'
import { PropiedadPrecio } from './value-objects/propiedad-precio.vo'
import { PropiedadTitulo } from './value-objects/propiedad-titulo.vo'
import { PropiedadZona } from './value-objects/propiedad-zona.vo'

export interface PropiedadAggregateProps {
  id: PropiedadId
  titulo: PropiedadTitulo
  zona: PropiedadZona
  estado: PropiedadEstado
  metrosCuadrados: PropiedadMetroscuadrados
  habitaciones: PropiedadHabitaciones
  precio: PropiedadPrecio
  fechaAlta: PropiedadFechaalta
  exclusiva: PropiedadExclusiva
  agenteId: AgenteId
  agenteName: string
}

export interface PropiedadPrimitiveProps {
  id: string
  titulo: string
  zona: string
  estado: string
  metrosCuadrados: number
  habitaciones: number
  precio: number
  fechaAlta: string
  exclusiva: boolean
  agenteId: string
  agenteName: string
}

export type PropiedadUpdateProps = Partial<Omit<PropiedadPrimitiveProps, 'id'>>

export interface RegisterPropiedadProps {
  id: string
  titulo: string
  zona?: string
  estado: string
  metrosCuadrados: number
  habitaciones: number
  precio: number
  fechaAlta: string
  exclusiva: boolean
  agenteId: string
  agenteName: string
}
