import { Nullable } from '../../../../shared/domain/types'
import { MuestraId } from '../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { PuntoId } from '../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { MuestraCodigo } from './value-objects/muestra-codigo.vo'
import { MuestraEstado } from './value-objects/muestra-estado.vo'
import { MuestraImporte } from './value-objects/muestra-importe.vo'
import { MuestraLimiteinforme } from './value-objects/muestra-limiteinforme.vo'
import { MuestraRecogida } from './value-objects/muestra-recogida.vo'
import { MuestraTecnico } from './value-objects/muestra-tecnico.vo'

export interface MuestraAggregateProps {
  id: MuestraId
  codigo: MuestraCodigo
  estado: MuestraEstado
  tecnico: MuestraTecnico
  recogida: MuestraRecogida
  limiteInforme: MuestraLimiteinforme
  importe: MuestraImporte
  puntoId: PuntoId
  puntoName: string
}

export interface MuestraPrimitiveProps {
  id: string
  codigo: string
  estado: string
  tecnico: string
  recogida: string
  limiteInforme: string
  importe: number
  puntoId: string
  puntoName: string
}

export type MuestraUpdateProps = Partial<Omit<MuestraPrimitiveProps, 'id'>>

export interface RegisterMuestraProps {
  id: string
  codigo: string
  estado: string
  tecnico?: string
  recogida: string
  limiteInforme: string
  importe: number
  puntoId: string
  puntoName: string
}
