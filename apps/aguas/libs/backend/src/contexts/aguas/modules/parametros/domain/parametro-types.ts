import { Nullable } from '../../../../shared/domain/types'
import { ParametroId } from '../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import { ParametroCodigo } from './value-objects/parametro-codigo.vo'
import { ParametroLimitelegal } from './value-objects/parametro-limitelegal.vo'
import { ParametroMetodo } from './value-objects/parametro-metodo.vo'
import { ParametroNombre } from './value-objects/parametro-nombre.vo'
import { ParametroPrecio } from './value-objects/parametro-precio.vo'

export interface ParametroAggregateProps {
  id: ParametroId
  codigo: ParametroCodigo
  nombre: ParametroNombre
  metodo: ParametroMetodo
  limiteLegal: ParametroLimitelegal
  precio: ParametroPrecio
}

export interface ParametroPrimitiveProps {
  id: string
  codigo: string
  nombre: string
  metodo: string
  limiteLegal: number
  precio: number
}

export type ParametroUpdateProps = Partial<Omit<ParametroPrimitiveProps, 'id'>>

export interface RegisterParametroProps {
  id: string
  codigo: string
  nombre?: string
  metodo?: string
  limiteLegal: number
  precio: number
}
