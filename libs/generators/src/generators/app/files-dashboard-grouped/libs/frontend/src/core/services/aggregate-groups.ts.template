/**
 * El desglose que devuelve el endpoint de agregación (spec 72). La CLAVE es dato —'pending',
 * '2026-08'— y su etiqueta es presentación: se compone aquí, en el idioma de quien mira, no en el
 * servidor.
 */
export interface AggregateGroup {
  key: string
  value: number | null
}

/** 'YYYY-MM' → 'ago'. Se compone en hora local a mano: `new Date('2026-08')` es UTC y en husos
 *  al oeste de Greenwich devolvería el mes anterior. */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  if (!year || !month) return key

  return new Date(year, month - 1, 1).toLocaleDateString('es-ES', { month: 'short' })
}
