import { ResourceDefinition } from '@raptor/schema'
import { expandCode } from '../expand-code'
import { contract } from './contract.model'
import { customer } from './customer.model'
import { license } from './license.model'
import { project } from './project.model'
import { vehicle } from './vehicle.model'
import { client } from './client.model'
import { sale } from './sale.model'
import { garment } from './garment.model'
import { supplier } from './supplier.model'
import { movement } from './movement.model'
import { account } from './account.model'
import { installation } from './installation.model'
import { material } from './material.model'
import { worklog } from './worklog.model'

/**
 * Single model registry — the one place a resource is declared.
 * Every generator (resource, kernel, root, shared-domain) derives its output from
 * this map, so registering a model here is all it takes for the whole app to know
 * about it: its module, its shared DTOs, its id VO and its wiring in the root.
 *
 * Static on purpose (bundle-safe, same pattern as the reference's config-sources.ts):
 * the plugin is bundled, so a directory scan would not survive the build.
 */
/**
 * Los modelos se registran EXPANDIDOS: `code: { prefix, padding }` se declara como intención
 * y aquí se convierte en un campo normal (spec 19). Se hace en la frontera del registro y no
 * en cada generador para que todos —recurso, kernel, shared-domain, migraciones— vean
 * exactamente el mismo modelo; hacerlo por separado ya dejó un DTO sin el campo.
 */
const REGISTERED: Record<string, ResourceDefinition> = {
  contract,
  customer,
  license,
  project,
  vehicle,
  client,
  sale,
  garment,
  supplier,
  movement,
  account,
  installation,
  material,
  worklog
}

export const MODELS: Record<string, ResourceDefinition> = Object.fromEntries(
  Object.entries(REGISTERED).map(([name, model]) => [name, expandCode(model)])
)

export const MODEL_LIST: ResourceDefinition[] = Object.values(MODELS)

/**
 * Registra modelos EXTERNOS (resources embebidos en un --appFile del estudio)
 * para la generación en curso: los sub-generadores (kernel, root, shared-domain,
 * resource) los resuelven por selectModels como si fueran del registro estático.
 * Muta los bindings exportados a propósito — el proceso de generación es efímero.
 */
export function registerModels(models: ResourceDefinition[]): void {
  for (const model of models) {
    const expanded = expandCode(model)
    if (!MODELS[model.name]) MODEL_LIST.push(expanded)
    MODELS[model.name] = expanded
  }
}

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
