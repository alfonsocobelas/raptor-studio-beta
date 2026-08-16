import { Nullable } from '../../../../shared/domain/types'
import { PuntoId } from '../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { ClienteId } from '../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { PuntoCoordenadas } from './value-objects/punto-coordenadas.vo'
import { PuntoDireccion } from './value-objects/punto-direccion.vo'
import { PuntoNombre } from './value-objects/punto-nombre.vo'
import { PuntoObligatorio } from './value-objects/punto-obligatorio.vo'
import { PuntoTipoagua } from './value-objects/punto-tipoagua.vo'

export interface PuntoAggregateProps {
  id: PuntoId
  nombre: PuntoNombre
  tipoAgua: PuntoTipoagua
  direccion: PuntoDireccion
  coordenadas: PuntoCoordenadas
  obligatorio: PuntoObligatorio
  clienteId: ClienteId
  clienteName: string
}

export interface PuntoPrimitiveProps {
  id: string
  nombre: string
  tipoAgua: string
  direccion: string
  coordenadas: string
  obligatorio: boolean
  clienteId: string
  clienteName: string
}

export type PuntoUpdateProps = Partial<Omit<PuntoPrimitiveProps, 'id'>>

export interface RegisterPuntoProps {
  id: string
  nombre: string
  tipoAgua: string
  direccion?: string
  coordenadas?: string
  obligatorio: boolean
  clienteId: string
  clienteName: string
}
