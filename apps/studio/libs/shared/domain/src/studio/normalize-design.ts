import type { BlockKind, DesignBlock, DesignPage, KpiCell, KpiCellKind } from './design-page'

/**
 * Migración de lectura de la spec 73: los diseños guardados (y los que proponga el chat) hablan
 * los bloques sueltos de la familia analítica — `kpi`, `top-n`, `count-by`, `series` y el `kpis`
 * de contadores con `resources`. Aquí cada uno se convierte en una fila `kpis` con celdas, campo
 * a campo, en el ÚNICO punto por el que las páginas entran al estudio. Nadie migra los ficheros:
 * el siguiente autosave los reescribe ya en formato nuevo.
 */

/** Los kinds sueltos que dejaron de existir en la spec 73; solo se ven al LEER un diseño viejo. */
type LegacyKind = Exclude<KpiCellKind, 'counter'>

/** Un bloque tal y como puede venir de un JSON antiguo: kind viejo y campos de celda en el bloque. */
type LegacyDesignBlock = Omit<DesignBlock, 'kind'> &
  Partial<Omit<KpiCell, 'kind' | 'resource'>> & { kind: BlockKind | LegacyKind }

const LEGACY_KINDS: LegacyKind[] = ['kpi', 'top-n', 'count-by', 'series']

export function normalizeDesignPages(pages: DesignPage[]): DesignPage[] {
  return pages.map(page => ({ ...page, blocks: page.blocks.map(block => normalizeBlock(block as LegacyDesignBlock)) }))
}

function normalizeBlock(block: LegacyDesignBlock): DesignBlock {
  const width = block.width === undefined ? {} : { width: block.width }

  if ((LEGACY_KINDS as string[]).includes(block.kind)) {
    return { kind: 'kpis', ...width, items: [cellOf(block)] }
  }
  if (block.kind === 'kpis' && block.items === undefined) {
    return { kind: 'kpis', ...width, items: (block.resources ?? []).map(resource => ({ kind: 'counter', resource })) }
  }
  return block as DesignBlock
}

/** Copia a la celda SOLO los campos de celda presentes en el bloque viejo, sin ancho ni texto. */
function cellOf(block: LegacyDesignBlock): KpiCell {
  const { kind, resource } = block
  const cell: KpiCell = { kind: kind as KpiCellKind, resource: resource ?? '' }
  for (const field of CELL_FIELDS) {
    const value = block[field]
    if (value !== undefined) Object.assign(cell, { [field]: value })
  }
  return cell
}

const CELL_FIELDS = [
  'kpiLabel',
  'kpiMeasure',
  'kpiField',
  'kpiConditionField',
  'kpiConditionOperator',
  'kpiConditionValue',
  'kpiWindowField',
  'kpiWindowPreset',
  'kpiWindowDays',
  'kpiRatio',
  'kpiCompare',
  'kpiTarget',
  'kpiSparkline',
  'axisField',
  'measure',
  'measureField',
  'topField',
  'topN',
  'topLabelField',
  'topDir'
] as const
