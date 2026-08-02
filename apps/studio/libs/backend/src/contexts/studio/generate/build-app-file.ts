import { designPagesToAppPages, draftToResource } from '@app/shared/domain'
import type { AppDefinition, ResourceDefinition } from '@acc/schema'
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

  return {
    schemaVersion: 1,
    name,
    ...(themeId ? { theme: { id: themeId } } : {}),
    pages: designPagesToAppPages(design.pages),
    resources: design.resources.map(r => draftToResource(r, name, design.resources))
  }
}
