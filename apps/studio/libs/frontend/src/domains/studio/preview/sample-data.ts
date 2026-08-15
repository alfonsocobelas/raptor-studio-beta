import type { BadgeEntry, FieldDefinition, ResourceDefinition } from '@raptor/schema'

/**
 * Datos de muestra del visor: TODO deriva del resource-schema y es determinista
 * (misma entrada → mismas filas). Sin red, sin aleatoriedad, sin estado propio.
 */

export interface PreviewColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'badge' | 'boolean'
  badgeMap?: Record<string, BadgeEntry>
  minWidth?: number
}

/** Campos con table.show, ordenados por table.order (fallback: orden de declaración). */
export function visibleColumns(model: ResourceDefinition): PreviewColumn[] {
  return Object.entries(model.fields)
    .filter((entry): entry is [string, FieldDefinition & { table: NonNullable<FieldDefinition['table']> }] =>
      Boolean(entry[1].table?.show)
    )
    .sort(([, a], [, b]) => (a.table.order ?? Number.MAX_SAFE_INTEGER) - (b.table.order ?? Number.MAX_SAFE_INTEGER))
    .map(([key, field]) => ({
      key,
      label: field.table.label ?? key,
      type: field.table.type ?? derivedType(field),
      badgeMap: field.table.badgeMap,
      minWidth: field.table.minWidth
    }))
}

function derivedType(field: FieldDefinition): PreviewColumn['type'] {
  if (field.type === 'number' || field.type === 'integer') return 'number'
  if (field.type === 'date' || field.type === 'timestamptz') return 'date'
  if (field.type === 'boolean') return 'boolean'
  return undefined
}

/** Filas de muestra: una entrada por columna visible, valores plausibles por tipo. */
export function sampleRows(model: ResourceDefinition, count: number): Record<string, unknown>[] {
  const columns = visibleColumns(model)
  const singular = model.labels?.singular ?? model.name
  return Array.from({ length: count }, (_, i) =>
    Object.fromEntries(columns.map(col => [col.key, sampleValue(model.fields[col.key], col, singular, i)]))
  )
}

function sampleValue(field: FieldDefinition, col: PreviewColumn, singular: string, index: number): unknown {
  if (col.badgeMap) {
    const keys = Object.keys(col.badgeMap)
    return keys[index % keys.length]
  }
  switch (field.type) {
    case 'number':
      return (index + 1) * 25.5
    case 'integer':
      return (index + 1) * 12
    case 'boolean':
      // Sí/No, como la ficha y como el listado emitido: nadie lee 'true' en una tabla
      return index % 2 === 0 ? 'Sí' : 'No'
    case 'date':
    case 'timestamptz':
      return new Date(Date.UTC(2026, 0, 1 + index)).toISOString()
    case 'uuid':
      return `00000000-0000-7000-8000-00000000000${index % 10}`
    default:
      return col.key === 'name' ? `${singular} ${index + 1}` : `${col.label} ${index + 1}`
  }
}

/** Total de muestra por posición del widget (mismo espíritu que dashboardSubstitutions). */
export function sampleTotal(index: number): number {
  return (index + 1) * 7
}
