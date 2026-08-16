import { Nullable } from '../../../../shared/domain/types'
import { ClienteId } from '../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { ClienteLocalidad } from './value-objects/cliente-localidad.vo'
import { ClienteNombre } from './value-objects/cliente-nombre.vo'
import { ClienteTelefono } from './value-objects/cliente-telefono.vo'
import { ClienteTipo } from './value-objects/cliente-tipo.vo'

export interface ClienteAggregateProps {
  id: ClienteId
  nombre: ClienteNombre
  tipo: ClienteTipo
  telefono: ClienteTelefono
  localidad: ClienteLocalidad
}

export interface ClientePrimitiveProps {
  id: string
  nombre: string
  tipo: string
  telefono: string
  localidad: string
}

export type ClienteUpdateProps = Partial<Omit<ClientePrimitiveProps, 'id'>>

export interface RegisterClienteProps {
  id: string
  nombre: string
  tipo: string
  telefono?: string
  localidad?: string
}
