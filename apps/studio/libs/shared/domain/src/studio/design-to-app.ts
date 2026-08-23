import type { AppDefinition } from '@raptor/schema'
import type { DashboardBlock } from '@raptor/schema'
import type { DesignPage } from './design-page'

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
function panelBlocks(page: DesignPage): DashboardBlock[] {
  const blocks: DashboardBlock[] = []
  const tables: string[] = []

  for (const block of page.blocks) {
    const width = block.width === 'half' ? 'half' : 'full'
    if (block.kind === 'kpis' && block.resources?.length) {
      blocks.push({ kind: 'metrics', resources: block.resources, width })
      continue
    }
    if (block.kind === 'table' && block.resource && !tables.includes(block.resource)) {
      tables.push(block.resource)
      blocks.push({ kind: 'table', resource: block.resource, width })
    }
  }

  return blocks
}

/** Los recursos cuyo listado viaja DENTRO del panel: no emiten además su pantalla. */
function carriedTables(blocks: DashboardBlock[]): string[] {
  return blocks.filter(block => block.kind === 'table').map(block => block.resource)
}

export function designPagesToAppPages(pages: DesignPage[]): AppDefinition['pages'] {
  const result: AppDefinition['pages'] = []
  const listed = new Set<string>()
  let hasDashboard = false

  for (const page of pages) {
    const kpis = page.blocks.some(b => b.kind === 'kpis' && b.resources?.length)
    // spec 52 y 53: los bloques DE ESTA VISTA viven dentro del panel, en el orden dibujado.
    // Antes los listados salían fuera, el panel quedaba sin tabla y el listado se comía el
    // título de la siguiente vista que repitiera el recurso (demo taller).
    const blocks = kpis && !hasDashboard ? panelBlocks(page) : []
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
                : null
      if (kind === null || !block.resource) continue
      // un calendario sin campo fecha es diseño y nada más: emitirlo dejaría
      // una entrada de menú apuntando a una ruta que el generador no crea
      if (block.kind === 'calendar' && !block.dateField) continue
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
