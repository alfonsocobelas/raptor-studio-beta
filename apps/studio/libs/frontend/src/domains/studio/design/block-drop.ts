import { generableHere, type BlockKind, type DesignBlock, type DesignPage, type DraftResource } from '@app/shared/domain'
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

/**
 * Colocar un componente (soltándolo o pulsándolo) y CONTAR lo que ha pasado.
 *
 * El bloque cae SIEMPRE donde se suelta: mover uno a otra vista a espaldas de
 * quien lo arrastra se lee como haber perdido lo que estaba mirando. Lo que sí
 * se dice es cuándo la caída no llega al código —el gate revirtió la mutación,
 * o el bloque solo se emite dentro de la ficha del registro—, porque callarlo
 * era la otra mitad del «no funciona».
 */
export function placeBlock(deps: PlaceDeps, pageIndex: number, kind: BlockKind, resource: string, at?: number): void {
  if (!deps.store.addBlock(pageIndex, blockFor(kind, resource), at)) {
    deps.notice.show(`No se ha podido añadir el bloque: ${deps.store.lastError() ?? 'el diseño no lo admite'}`)
    return
  }

  const page = deps.store.pages()[pageIndex]
  if (page && !generableHere(page, blockFor(kind, resource))) {
    deps.notice.show(
      `Este bloque solo se emite dentro de la ficha del registro: aquí es diseño y no llega a la app generada.`
    )
  }
}
