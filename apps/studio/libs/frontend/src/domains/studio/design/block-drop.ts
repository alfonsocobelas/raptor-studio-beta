import type { BlockKind, DesignBlock, DesignPage, DraftResource } from '@app/shared/domain'

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
