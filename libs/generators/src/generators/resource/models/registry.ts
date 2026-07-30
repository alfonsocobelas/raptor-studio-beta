import { ResourceDefinition } from '@acc/schema'
import { contract } from './contract.model'
import { customer } from './customer.model'
import { license } from './license.model'
import { project } from './project.model'
import { vehicle } from './vehicle.model'
import { client } from './client.model'
import { sale } from './sale.model'

/**
 * Single model registry — the one place a resource is declared.
 * Every generator (resource, kernel, root, shared-domain) derives its output from
 * this map, so registering a model here is all it takes for the whole app to know
 * about it: its module, its shared DTOs, its id VO and its wiring in the root.
 *
 * Static on purpose (bundle-safe, same pattern as the reference's config-sources.ts):
 * the plugin is bundled, so a directory scan would not survive the build.
 */
export const MODELS: Record<string, ResourceDefinition> = {
  contract,
  customer,
  license,
  project,
  vehicle,
  client,
  sale
}

export const MODEL_LIST: ResourceDefinition[] = Object.values(MODELS)

/**
 * Modelos de una app concreta. Sin `names` devuelve el registro entero;
 * con una lista, solo esos (un proyecto de cliente no arrastra los modelos de otro).
 */
export function selectModels(names?: string): ResourceDefinition[] {
  if (!names?.trim()) {
    return MODEL_LIST
  }
  return names
    .split(',')
    .map(n => n.trim())
    .filter(Boolean)
    .map(n => {
      const model = MODELS[n]
      if (!model) {
        throw new Error(`Unknown resource model '${n}'. Available models: ${Object.keys(MODELS).join(', ')}`)
      }
      return model
    })
}
