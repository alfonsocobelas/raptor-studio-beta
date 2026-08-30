import { designPagesToAppPages, draftToResource } from '@app/shared/domain'
import type { AppDefinition, ResourceDefinition } from '@raptor/schema'
import type { DesignPayload } from '../chat/chat.types'

export interface AppFileContent extends AppDefinition {
  /** Los resource-schemas viajan EXPANDIDOS en el mismo fichero que la app */
  resources: ResourceDefinition[]
}

/**
 * El artefacto de `--appFile`: app-schema (vistas traducidas + tema) con los
 * resource-schemas ya expandidos. Es la frontera entre el diseño y el
 * generador, así que vive aparte del controlador y se prueba sola.
 */
export function buildAppFile(design: DesignPayload, name: string): AppFileContent {
  // 'neutral' es exactamente lo que emite el esqueleto: declararlo sería ruido
  const themeId = design.palette && design.palette !== 'neutral' ? design.palette : undefined

  // Un flujo que alude a una entidad que no viaja rompería AQUÍ, no en la app
  // generada: la frontera es el último punto con contexto para explicarlo (spec 28).
  const shipped = new Set(design.resources.map(r => r.name))
  for (const flow of design.flows ?? []) {
    for (const node of flow.nodes) {
      if (node.entity !== undefined && !shipped.has(node.entity)) {
        throw new Error(`El flujo «${flow.name}» alude a una entidad que no viaja en el diseño: ${node.entity}`)
      }
    }
  }

  return {
    schemaVersion: 1,
    name,
    ...(themeId ? { theme: { id: themeId } } : {}),
    ...(design.ports ? { ports: design.ports } : {}),
    // la memoria del negocio cruza la frontera: la app generada nace sabiendo su porqué (spec 22)
    ...(design.brief ? { brief: design.brief } : {}),
    // los procesos dibujados acompañan al diseño: sección del CLAUDE.md emitido (spec 28)
    ...(design.flows?.length ? { flows: design.flows } : {}),
    // los roles personalizados cruzan la frontera: amplían el IAM emitido (spec 76)
    ...(design.roles?.length ? { roles: design.roles } : {}),
    pages: designPagesToAppPages(
      design.pages,
      resource => design.resources.find(r => r.name === resource)?.labelPlural ?? resource
    ),
    resources: design.resources.map(r => draftToResource(r, name, design.resources))
  }
}
