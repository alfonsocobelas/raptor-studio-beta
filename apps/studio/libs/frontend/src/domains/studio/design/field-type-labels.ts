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
  uuid: 'uuid',
  ref: 'referencia a…',
  enum: 'lista de valores',
  time: 'hora'
}

/** Etiqueta con red: un tipo sin nombre se muestra por su identificador, nunca vacío. */
export function labelOfType(type: string): string {
  return TYPE_LABELS[type as DraftFieldType] ?? type
}

/**
 * Versión corta para el diagrama del modelo, donde la etiqueta va en versalitas a la
 * derecha del nombre y no puede robarle sitio. «texto largo» no cabe; «txt+» sí.
 */
export const SHORT_TYPE_LABELS: Record<DraftFieldType, string> = {
  string: 'texto',
  text: 'txt+',
  number: 'núm',
  integer: 'entero',
  boolean: 'sí/no',
  date: 'fecha',
  uuid: 'uuid',
  ref: 'ref',
  enum: 'lista',
  time: 'hora'
}

export function shortLabelOfType(type: string): string {
  return SHORT_TYPE_LABELS[type as DraftFieldType] ?? type
}

export const LABELLED_TYPES = DRAFT_FIELD_TYPES
