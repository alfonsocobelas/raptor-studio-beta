import { Nullable } from '../../../../shared/domain/types'
import { VisitaId } from '../../../../shared/domain/value-objects/visitas/visita-id.vo'
import { PropiedadId } from '../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { VisitaConfirmada } from './value-objects/visita-confirmada.vo'
import { VisitaFecha } from './value-objects/visita-fecha.vo'
import { VisitaInteresado } from './value-objects/visita-interesado.vo'
import { VisitaObservaciones } from './value-objects/visita-observaciones.vo'
import { VisitaReferencia } from './value-objects/visita-referencia.vo'

export interface VisitaAggregateProps {
  id: VisitaId
  referencia: VisitaReferencia
  fecha: VisitaFecha
  interesado: VisitaInteresado
  observaciones: VisitaObservaciones
  confirmada: VisitaConfirmada
  propiedadId: PropiedadId
  propiedadName: string
}

export interface VisitaPrimitiveProps {
  id: string
  referencia: string
  fecha: string
  interesado: string
  observaciones: string
  confirmada: boolean
  propiedadId: string
  propiedadName: string
}

export type VisitaUpdateProps = Partial<Omit<VisitaPrimitiveProps, 'id'>>

export interface RegisterVisitaProps {
  id: string
  referencia: string
  fecha: string
  interesado?: string
  observaciones?: string
  confirmada: boolean
  propiedadId: string
  propiedadName: string
}
