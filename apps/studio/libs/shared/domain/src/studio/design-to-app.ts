import type { AppDefinition } from '@raptor/schema'
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
/** Los recursos cuyas tablas dibuja ESTA vista, sin repetidos y en el orden dibujado. */
function dashboardTables(page: DesignPage): string[] {
  const resources: string[] = []
  for (const block of page.blocks) {
    if (block.kind !== 'table' || !block.resource) continue
    if (!resources.includes(block.resource)) resources.push(block.resource)
  }

  return resources
}

export function designPagesToAppPages(pages: DesignPage[]): AppDefinition['pages'] {
  const result: AppDefinition['pages'] = []
  const listed = new Set<string>()
  let hasDashboard = false

  for (const page of pages) {
    const kpis = page.blocks.filter(b => b.kind === 'kpis').flatMap(b => b.resources ?? [])
    // spec 52: los listados DE ESTA VISTA viven dentro del panel, no en pantallas aparte.
    // Antes salían fuera, el panel quedaba sin tabla y el listado se comía el título de la
    // siguiente vista que repitiera el recurso (demo taller).
    const carried = kpis.length && !hasDashboard ? dashboardTables(page) : []
    if (kpis.length && !hasDashboard) {
      result.push({
        kind: 'dashboard',
        label: page.title,
        widgets: kpis.map(resource => ({ kind: 'kpi-total', resource })),
        ...(carried.length ? { tables: carried } : {})
      })
      hasDashboard = true
    }

    // el título de la vista solo puede nombrar UNA entrada de menú: si la vista
    // ya produjo el dashboard, los listados usan su propia etiqueta por defecto
    let titleTaken = kpis.length > 0
    for (const block of page.blocks) {
      const kind = block.kind === 'table' ? 'resource' : block.kind === 'cards' ? 'cards' : block.kind === 'form' ? 'form' : null
      if (kind === null || !block.resource) continue
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
