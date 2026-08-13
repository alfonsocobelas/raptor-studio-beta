import type { DesignPage } from '@app/shared/domain'

/** La entidad de la que trata una vista de ficha. */
export function detailResource(page: DesignPage): string | undefined {
  return page.blocks.find(block => block.resource)?.resource
}

/**
 * Dónde está, en el diseño, la ficha de esta entidad. `null` si no hay: el diseño
 * puede tener el listado sin haber creado todavía la pantalla a la que lleva, y
 * entonces no hay a dónde saltar. Es la misma pareja listado→ficha que dibuja el
 * árbol del raíl de Vistas.
 */
export function detailPageIndex(pages: DesignPage[], resource: string): number | null {
  const index = pages.findIndex(page => page.drillDown && detailResource(page) === resource)
  return index === -1 ? null : index
}
