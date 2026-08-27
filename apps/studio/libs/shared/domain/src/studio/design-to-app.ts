import type { AppDefinition } from '@raptor/schema'
import type { DashboardBlock, KpiMeasure, KpiOperator, KpiWindowPreset } from '@raptor/schema'
import type { DesignBlock, DesignPage } from './design-page'

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
    if (block.kind === 'kpis' && block.resources?.length) {
      blocks.push({ kind: 'metrics', resources: block.resources, width })
      continue
    }
    if (block.kind === 'kpi' && block.resource) {
      blocks.push(kpiBlockOf(block, width, labelOf(block.resource)))
      continue
    }
    if (block.kind === 'top-n' && block.resource && block.topField) {
      blocks.push({
        kind: 'top-n',
        resource: block.resource,
        field: block.topField,
        n: block.topN ?? 5,
        dir: block.topDir ?? 'desc',
        ...(block.topLabelField ? { labelField: block.topLabelField } : {}),
        ...(block.kpiLabel?.trim() ? { label: block.kpiLabel.trim() } : {}),
        width
      })
      continue
    }
    if (block.kind === 'table' && block.resource && !tables.includes(block.resource)) {
      tables.push(block.resource)
      blocks.push({ kind: 'table', resource: block.resource, width })
    }
  }

  return blocks
}

/**
 * Los campos PLANOS del bloque dibujado se ensamblan aquí en los objetos anidados del
 * app-schema (spec 70). La etiqueta nunca falta: el app-schema la exige y el lienzo no obliga a
 * escribirla, así que sin ella se usa el plural de la entidad.
 */
function kpiBlockOf(block: DesignBlock, width: 'full' | 'half', fallbackLabel: string): DashboardBlock {
  const condition =
    block.kpiConditionField && block.kpiConditionValue !== undefined && block.kpiConditionValue !== ''
      ? {
          field: block.kpiConditionField,
          operator: (block.kpiConditionOperator ?? 'eq') as KpiOperator,
          value: block.kpiConditionValue
        }
      : undefined
  // una ventana sin campo fecha no acota nada: no cruza
  const window =
    block.kpiWindowPreset && block.kpiWindowField
      ? {
          field: block.kpiWindowField,
          preset: block.kpiWindowPreset as KpiWindowPreset,
          ...(block.kpiWindowPreset === 'days' ? { days: block.kpiWindowDays ?? 30 } : {})
        }
      : undefined

  // una medida sin campo no puede cruzar: el app-schema la rechazaría (spec 71)
  const measure = block.kpiMeasure && block.kpiMeasure !== 'count' && block.kpiField ? block.kpiMeasure : 'count'

  return {
    kind: 'kpi',
    resource: block.resource as string,
    label: block.kpiLabel?.trim() || fallbackLabel,
    measure: measure as KpiMeasure,
    ...(measure !== 'count' ? { field: block.kpiField } : {}),
    ...(condition ? { condition } : {}),
    ...(window ? { window } : {}),
    ...(block.kpiRatio && measure === 'count' ? { ratio: true } : {}),
    // sin ventana no hay periodo anterior con el que comparar
    ...(block.kpiCompare && window ? { compare: true } : {}),
    ...(block.kpiTarget !== undefined && !block.kpiRatio ? { target: block.kpiTarget } : {}),
    width
  }
}

/** Los bloques que viven DENTRO del panel: cualquiera de ellos abre el dashboard de la vista. */
function isPanelBlock(block: DesignBlock): boolean {
  if (block.kind === 'kpis') return (block.resources?.length ?? 0) > 0
  if (block.kind === 'kpi') return block.resource !== undefined
  if (block.kind === 'top-n') return block.resource !== undefined && block.topField !== undefined
  return false
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
    // cualquier bloque de panel abre el dashboard, no solo la fila de KPIs (spec 70)
    const kpis = page.blocks.some(isPanelBlock)
    // spec 52 y 53: los bloques DE ESTA VISTA viven dentro del panel, en el orden dibujado.
    // Antes los listados salían fuera, el panel quedaba sin tabla y el listado se comía el
    // título de la siguiente vista que repitiera el recurso (demo taller).
    const blocks = kpis && !hasDashboard ? panelBlocks(page, labelOf) : []
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
