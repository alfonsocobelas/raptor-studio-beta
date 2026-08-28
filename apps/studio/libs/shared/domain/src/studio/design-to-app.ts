import type { AppDefinition } from '@raptor/schema'
import type { DashboardBlock, KpiMeasure, KpiOperator, KpiRowCell, KpiWindowPreset } from '@raptor/schema'
import { generableCell, type DesignPage, type KpiCell } from './design-page'

/**
 * Traduce las VISTAS del lienzo (composición de bloques) a las páginas del
 * app-schema. Es la frontera de la regla 7: solo cruzan los bloques que el
 * generador sabe emitir hoy — tabla → listado, KPIs → dashboard, galería →
 * tarjetas, formulario → página form (spec 48). El resto se queda en el diseño
 * (el lienzo ya los marca «aún no generable»).
 *
 * Vive en dominio compartido porque la usan los DOS lados: el lienzo para
 * previsualizar el schema y el backend para construir el --appFile. Tenerla
 * duplicada fue el origen del bug «page.blocks is not iterable».
 */
/**
 * Los bloques del panel que ESTA vista dibuja, en su orden y con su ancho (spec 53): la fila de
 * KPIs y los listados. Sin repetidos: la frontera colapsaría dos bloques iguales de todos modos.
 */
function panelBlocks(page: DesignPage, labelOf: (resource: string) => string): DashboardBlock[] {
  const blocks: DashboardBlock[] = []
  const tables: string[] = []

  for (const block of page.blocks) {
    const width = block.width === 'half' ? 'half' : 'full'
    // la fila de KPIs cruza celda a celda (spec 73): la celda incompleta se queda en el diseño
    // (el lienzo la marca) y una fila sin celdas emitibles no cruza entera
    if (block.kind === 'kpis') {
      const cells = (block.items ?? [])
        .map(cell => rowCellOf(cell, labelOf))
        .filter((cell): cell is KpiRowCell => cell !== null)
      if (cells.length) blocks.push({ kind: 'kpi-row', cells, width })
      continue
    }
    if (block.kind === 'table' && block.resource && !tables.includes(block.resource)) {
      tables.push(block.resource)
      blocks.push({ kind: 'table', resource: block.resource, width })
    }
  }

  return blocks
}

/** Traduce UNA celda dibujada a su celda del app-schema, o null si aún no es generable. */
function rowCellOf(cell: KpiCell, labelOf: (resource: string) => string): KpiRowCell | null {
  // la MISMA regla que marca la celda en el lienzo: incompleta → no cruza (no se falsea)
  if (!generableCell(cell)) return null
  if (cell.kind === 'counter') return { kind: 'counter', resource: cell.resource }
  if (cell.kind === 'kpi') return kpiCellOf(cell, labelOf(cell.resource))
  if (cell.kind === 'top-n') {
    return {
      kind: 'top-n',
      resource: cell.resource,
      field: cell.topField as string,
      n: cell.topN ?? 5,
      dir: cell.topDir ?? 'desc',
      ...(cell.topLabelField ? { labelField: cell.topLabelField } : {}),
      ...(cell.kpiLabel?.trim() ? { label: cell.kpiLabel.trim() } : {})
    }
  }
  const measure = cell.measure && cell.measure !== 'count' && cell.measureField ? cell.measure : 'count'
  return {
    kind: cell.kind,
    resource: cell.resource,
    field: cell.axisField as string,
    ...(measure !== 'count' ? { measure: measure as KpiMeasure, measureField: cell.measureField } : {}),
    ...(cell.kpiLabel?.trim() ? { label: cell.kpiLabel.trim() } : {})
  }
}

/**
 * Los campos PLANOS de la celda dibujada se ensamblan aquí en los objetos anidados del
 * app-schema (spec 70). La etiqueta nunca falta: el app-schema la exige y el lienzo no obliga a
 * escribirla, así que sin ella se usa el plural de la entidad.
 */
function kpiCellOf(cell: KpiCell, fallbackLabel: string): KpiRowCell {
  const condition =
    cell.kpiConditionField && cell.kpiConditionValue !== undefined && cell.kpiConditionValue !== ''
      ? {
          field: cell.kpiConditionField,
          operator: (cell.kpiConditionOperator ?? 'eq') as KpiOperator,
          value: cell.kpiConditionValue
        }
      : undefined
  // una ventana sin campo fecha no acota nada: no cruza
  const window =
    cell.kpiWindowPreset && cell.kpiWindowField
      ? {
          field: cell.kpiWindowField,
          preset: cell.kpiWindowPreset as KpiWindowPreset,
          ...(cell.kpiWindowPreset === 'days' ? { days: cell.kpiWindowDays ?? 30 } : {})
        }
      : undefined

  const measure = cell.kpiMeasure && cell.kpiMeasure !== 'count' ? cell.kpiMeasure : 'count'

  return {
    kind: 'kpi',
    resource: cell.resource,
    label: cell.kpiLabel?.trim() || fallbackLabel,
    measure: measure as KpiMeasure,
    ...(measure !== 'count' ? { field: cell.kpiField } : {}),
    ...(condition ? { condition } : {}),
    ...(window ? { window } : {}),
    ...(cell.kpiRatio && measure === 'count' && condition ? { ratio: true } : {}),
    // sin ventana no hay periodo anterior con el que comparar, ni fecha sobre la que hacer los meses
    ...(cell.kpiCompare && window ? { compare: true } : {}),
    ...(cell.kpiSparkline && window ? { sparkline: true } : {}),
    ...(cell.kpiTarget !== undefined && !cell.kpiRatio ? { target: cell.kpiTarget } : {})
  }
}

/** Los recursos cuyo listado viaja DENTRO del panel: no emiten además su pantalla. */
function carriedTables(blocks: DashboardBlock[]): string[] {
  return blocks.filter(block => block.kind === 'table').map(block => block.resource)
}

/**
 * @param labelOf etiqueta legible de una entidad; solo la usa la tarjeta KPI cuando el diseño no
 *   le ha puesto etiqueta (el app-schema la exige). Por defecto, el propio nombre de la entidad.
 */
export function designPagesToAppPages(
  pages: DesignPage[],
  labelOf: (resource: string) => string = resource => resource
): AppDefinition['pages'] {
  const result: AppDefinition['pages'] = []
  const listed = new Set<string>()
  let hasDashboard = false

  for (const page of pages) {
    // el disparador del panel ES lo que panelBlocks sabe cruzar: dos codificaciones paralelas de
    // «qué bloque abre el dashboard» ya habían empezado a discrepar (revisión specs 70-72).
    // Los LISTADOS no cuentan: una vista de solo tablas no es un panel (spec 52/53).
    const crossed = panelBlocks(page, labelOf)
    const kpis = crossed.some(block => block.kind !== 'table')
    const blocks = kpis && !hasDashboard ? crossed : []
    const carried = carriedTables(blocks)
    if (blocks.length) {
      result.push({ kind: 'dashboard', label: page.title, blocks })
      hasDashboard = true
    }

    // el título de la vista solo puede nombrar UNA entrada de menú: si la vista
    // ya produjo el dashboard, los listados usan su propia etiqueta por defecto
    let titleTaken = kpis
    for (const block of page.blocks) {
      const kind =
        block.kind === 'table'
          ? 'resource'
          : block.kind === 'cards'
            ? 'cards'
            : block.kind === 'form'
              ? 'form'
              : block.kind === 'calendar'
                ? 'calendar'
                : block.kind === 'kanban'
                  ? 'kanban'
                  : null
      if (kind === null || !block.resource) continue
      // un calendario sin campo fecha es diseño y nada más: emitirlo dejaría
      // una entrada de menú apuntando a una ruta que el generador no crea
      if (block.kind === 'calendar' && !block.dateField) continue
      // ídem: un kanban sin campo de columnas es diseño y nada más (spec 61)
      if (block.kind === 'kanban' && !block.columnsField) continue
      // la tabla que ya viaja DENTRO de este panel no produce además su pantalla: la misma
      // tabla en su PROPIA vista sí la produce, con su título — son dos sitios, no un duplicado
      if (carried.includes(block.resource)) continue
      const key = `${block.kind}:${block.resource}`
      if (listed.has(key)) continue
      listed.add(key)
      result.push({
        kind,
        resource: block.resource,
        ...(titleTaken ? {} : { label: page.title })
      })
      titleTaken = true
    }
  }

  return result
}
