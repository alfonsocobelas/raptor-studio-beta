import type { DashboardBlock, KpiRowCell } from './app-types'

/**
 * Normaliza los bloques del panel antes de validar y antes de componer: después de esto la parte
 * analítica son SOLO filas `kpi-row` (spec 73) — los kinds sueltos históricos (`metrics`, `kpi`,
 * `top-n`, `count-by`, `series` y el alias `kpi-count` de la spec 70) se envuelven en filas de una
 * celda, y toda celda `kpi` queda con su `measure` resuelta.
 *
 * Existe para no romper lo que ya está escrito: los `*.app.ts` de oro y los diseños guardados en
 * `.studio/designs/` hablan los kinds sueltos. Traducir al leer cuesta este fichero; migrar los
 * ficheros a mano costaba un diff de oro sucio y una demo rota.
 */
export function normalizeDashboardBlocks(blocks: DashboardBlock[]): DashboardBlock[] {
  return blocks.map(block => {
    if (block.kind === 'kpi-row') {
      return { ...block, cells: block.cells.map(normalizeCell) }
    }
    if (block.kind === 'metrics') {
      return rowOf(
        block.resources.map(resource => ({ kind: 'counter' as const, resource })),
        block.width
      )
    }
    if (block.kind === 'kpi-count') {
      const { resource, field, equals, label, width } = block
      return rowOf(
        [
          {
            kind: 'kpi',
            resource,
            label,
            measure: 'count',
            condition: { field, operator: 'eq', value: equals }
          }
        ],
        width
      )
    }
    if (block.kind === 'kpi' || block.kind === 'top-n' || block.kind === 'count-by' || block.kind === 'series') {
      const { width, ...cell } = block
      return rowOf([normalizeCell(cell)], width)
    }
    return block
  })
}

function rowOf(cells: KpiRowCell[], width: 'full' | 'half' | undefined): DashboardBlock {
  return { kind: 'kpi-row', cells, ...(width === undefined ? {} : { width }) }
}

function normalizeCell(cell: KpiRowCell): KpiRowCell {
  if (cell.kind === 'kpi') return { ...cell, measure: cell.measure ?? 'count' }
  return cell
}
