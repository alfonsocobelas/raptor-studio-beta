import { Nullable } from '../../../../shared/domain/types'
import { AgenteId } from '../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { AgenteActivo } from './value-objects/agente-activo.vo'
import { AgenteComisionporcentaje } from './value-objects/agente-comisionporcentaje.vo'
import { AgenteEmail } from './value-objects/agente-email.vo'
import { AgenteNombre } from './value-objects/agente-nombre.vo'
import { AgenteTelefono } from './value-objects/agente-telefono.vo'

export interface AgenteAggregateProps {
  id: AgenteId
  nombre: AgenteNombre
  email: AgenteEmail
  telefono: AgenteTelefono
  comisionPorcentaje: AgenteComisionporcentaje
  activo: AgenteActivo
}

export interface AgentePrimitiveProps {
  id: string
  nombre: string
  email: string
  telefono: string
  comisionPorcentaje: number
  activo: boolean
}

export type AgenteUpdateProps = Partial<Omit<AgentePrimitiveProps, 'id'>>

export interface RegisterAgenteProps {
  id: string
  nombre: string
  email?: string
  telefono?: string
  comisionPorcentaje: number
  activo: boolean
}
