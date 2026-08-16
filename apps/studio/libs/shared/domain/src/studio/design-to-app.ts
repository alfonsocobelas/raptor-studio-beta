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
export function designPagesToAppPages(pages: DesignPage[]): AppDefinition['pages'] {
  const result: AppDefinition['pages'] = []
  const listed = new Set<string>()
  let hasDashboard = false

  for (const page of pages) {
    const kpis = page.blocks.filter(b => b.kind === 'kpis').flatMap(b => b.resources ?? [])
    if (kpis.length && !hasDashboard) {
      result.push({
        kind: 'dashboard',
        label: page.title,
        widgets: kpis.map(resource => ({ kind: 'kpi-total', resource }))
      })
      hasDashboard = true
    }

    // el título de la vista solo puede nombrar UNA entrada de menú: si la vista
    // ya produjo el dashboard, los listados usan su propia etiqueta por defecto
    let titleTaken = kpis.length > 0
    for (const block of page.blocks) {
      const kind = block.kind === 'table' ? 'resource' : block.kind === 'cards' ? 'cards' : block.kind === 'form' ? 'form' : null
      if (kind === null || !block.resource) continue
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
