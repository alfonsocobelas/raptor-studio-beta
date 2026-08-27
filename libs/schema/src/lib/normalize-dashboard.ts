import type { DashboardBlock } from './app-types'

/**
 * Normaliza los bloques del panel antes de validar y antes de componer (spec 70): el alias
 * histórico `kpi-count` se traduce al kind `kpi` con su condición de igualdad, y todo `kpi`
 * queda con su `measure` resuelta.
 *
 * Existe para no romper lo que ya está escrito: dos `*.app.ts` de oro y los diseños guardados
 * en `.studio/designs/` hablan `kpi-count`. Traducir al leer cuesta este fichero; migrar los
 * ficheros a mano costaba un diff de oro sucio y una demo roja.
 */
export function normalizeDashboardBlocks(blocks: DashboardBlock[]): DashboardBlock[] {
  return blocks.map(block => {
    if (block.kind === 'kpi-count') {
      const { resource, field, equals, label, width } = block
      return {
        kind: 'kpi',
        resource,
        label,
        measure: 'count',
        condition: { field, operator: 'eq', value: equals },
        ...(width === undefined ? {} : { width })
      }
    }
    if (block.kind === 'kpi') return { ...block, measure: block.measure ?? 'count' }
    return block
  })
}
