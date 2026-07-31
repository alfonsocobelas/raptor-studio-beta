import { defineApp, type AppDefinition } from '@acc/schema'
import { composeApp } from '@acc/generators/src/generators/app/composition'
import { MODELS } from '@acc/generators/src/generators/resource/models/registry'

/**
 * Gate determinista del chat: validación estructural (defineApp) + referencias
 * contra el catálogo real (composeApp/MODELS). Lanza si la propuesta no es
 * generable; el controller lo traduce a 422 y el lienzo no cambia.
 */
export function validateProposal(schema: AppDefinition): AppDefinition {
  const validated = defineApp(JSON.parse(JSON.stringify(schema)) as AppDefinition)
  composeApp(validated, MODELS)
  return validated
}
