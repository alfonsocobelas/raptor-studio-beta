import { DRAFT_FIELD_TYPES, type DraftFieldType } from '@app/shared/domain'

/**
 * Nombre legible de cada tipo de columna. Vive aparte del componente para que un
 * test pueda exigir que NINGÚN tipo del contrato se quede sin etiqueta: al añadir
 * `enum` el desplegable del lienzo salió en blanco, sin avisar de nada.
 */
export const TYPE_LABELS: Record<DraftFieldType, string> = {
  string: 'texto',
  text: 'texto largo',
  number: 'número',
  integer: 'entero',
  boolean: 'sí/no',
  date: 'fecha',
  ref: 'referencia a…',
  enum: 'lista de valores'
}

/** Etiqueta con red: un tipo sin nombre se muestra por su identificador, nunca vacío. */
export function labelOfType(type: string): string {
  return TYPE_LABELS[type as DraftFieldType] ?? type
}

export const LABELLED_TYPES = DRAFT_FIELD_TYPES
