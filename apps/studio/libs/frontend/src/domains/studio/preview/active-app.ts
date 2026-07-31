import { composeApp, type AppComposition } from '@acc/generators/src/generators/app/composition'
import { APPS } from '@acc/generators/src/generators/app/apps/registry'
import { MODELS } from '@acc/generators/src/generators/resource/models/registry'

/**
 * Composición activa del visor (fase B: fija a la app boutique del catálogo).
 * Única fuente del preview: todo lo que se pinta deriva de aquí.
 * Deep imports del dist de @acc/generators: deuda aceptada en la spec 08
 * (módulos puros browser-safe; se extraerá @acc/catalog cuando la fase C mute schemas).
 */
export const ACTIVE_APP: AppComposition = composeApp(APPS['boutique'], MODELS)
