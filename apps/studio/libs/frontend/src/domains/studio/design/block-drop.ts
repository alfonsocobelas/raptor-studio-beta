import { DETAIL_BLOCKS, type BlockKind, type DesignBlock, type DesignPage, type DraftResource } from '@app/shared/domain'
import type { ActiveViewService } from './active-view.service'
import type { CanvasNoticeService } from './canvas-notice.service'
import type { DesignStore } from './design-store'

/**
 * De qué entidad habla un componente soltado en el lienzo. No se pregunta: manda
 * el contexto —la vista donde cae—, y solo cuando la vista aún no trata de nada
 * se recurre a la entidad elegida en el inspector y, en último término, a la
 * primera del modelo. Sin modelo no hay bloque posible: devuelve null.
 */
export function dropResource(
  page: DesignPage | undefined,
  activeResource: string | null,
  resources: DraftResource[]
): string | null {
  const own = page?.blocks.map(block => block.resource ?? block.resources?.[0]).find(Boolean)
  if (own) return own
  if (activeResource && resources.some(resource => resource.name === activeResource)) return activeResource
  return resources[0]?.name ?? null
}

/** El bloque que se crea al soltar: los KPIs se alimentan de una lista de entidades. */
export function blockFor(kind: BlockKind, resource: string): DesignBlock {
  return kind === 'kpis' ? { kind, resources: [resource] } : { kind, resource }
}

/** Los tres servicios que hacen falta para colocar un bloque y contarlo. */
export interface PlaceDeps {
  store: DesignStore
  notice: CanvasNoticeService
  active: ActiveViewService
}

/** La ficha de una entidad: la vista de detalle que ya habla de ella, si existe. */
function detailPage(store: DesignStore, resource: string): DesignPage | undefined {
  return store.pages().find(page => page.drillDown && page.blocks.some(block => block.resource === resource))
}

/**
 * Colocar un componente (soltándolo o pulsándolo) y CONTAR lo que ha pasado.
 *
 * Los tres finales posibles eran mudos y los tres se leían igual —«no funciona»,
 * o peor, «me ha borrado la tabla»—: el gate revierte la mutación, el bloque de
 * ficha se va a otra pantalla, o la ficha ya lo tenía y no cambia nada. El lienzo
 * NO se mueve de sitio en ningún caso: cambiarte de vista bajo el gesto se
 * confunde con haber perdido lo que estabas mirando. Se ofrece ir, y decides tú.
 */
export function placeBlock(deps: PlaceDeps, pageIndex: number, kind: BlockKind, resource: string, at?: number): void {
  const goesToDetail = DETAIL_BLOCKS.includes(kind) && !deps.store.pages()[pageIndex]?.drillDown
  const blocksBefore = goesToDetail ? detailPage(deps.store, resource)?.blocks.length : undefined

  if (!deps.store.addBlock(pageIndex, blockFor(kind, resource), at)) {
    deps.notice.show(`No se ha podido añadir el bloque: ${deps.store.lastError() ?? 'el diseño no lo admite'}`)
    return
  }
  if (!goesToDetail) return

  const detail = detailPage(deps.store, resource)
  const title = detail?.title ?? 'la ficha'
  deps.notice.show(
    blocksBefore !== undefined && detail?.blocks.length === blocksBefore
      ? `«${title}» ya tenía ese bloque: el diseño no cambia.`
      : `Ese bloque vive en la ficha de un registro: se ha añadido a «${title}».`,
    { label: 'Ver la ficha', run: () => deps.active.showDetailOf(resource) }
  )
}
