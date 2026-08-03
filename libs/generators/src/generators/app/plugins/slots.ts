import { authPlugin } from './auth.plugin'
import type { AppPlugin } from './plugin'

/**
 * Ranuras de capacidad (spec 22): una ranura es una decisión excluyente de la app
 * generada — se elige exactamente UN proveedor entre los registrados. Complementa
 * a los plugins aditivos de `registry.ts`; mismo estilo: manifiesto tipado, sin
 * decoradores. Añadir un proveedor aquí basta para que aparezca en el formulario
 * del generador, en slots.json y en el wizard del estudio.
 */

export interface SlotProvider {
  /** Valor del flag CLI ('postgres', 'material'…) */
  value: string
  /** Etiqueta que ve el usuario en el formulario */
  label: string
  description?: string
  /** Restricciones contra otras ranuras (p.ej. auth single-tenant emite persistencia TypeORM) */
  requires?: Record<string, string>
  /** Qué emite el proveedor; sin manifiesto no añade nada al árbol (p.ej. 'none') */
  plugin?: AppPlugin
}

export interface Slot {
  /** Nombre de la ranura y del flag CLI ('database', 'ui'…) */
  name: string
  /** Etiqueta del grupo en el formulario */
  label: string
  /** Proveedor elegido cuando no se pasa el flag */
  default: string
  providers: SlotProvider[]
}

export const SLOTS: Record<string, Slot> = {
  database: {
    name: 'database',
    label: 'Base de datos',
    default: 'postgres',
    providers: [
      { value: 'postgres', label: 'PostgreSQL (TypeORM)' },
      { value: 'mongo', label: 'MongoDB (Mongoose)' }
    ]
  },
  ui: {
    name: 'ui',
    label: 'Componentes',
    default: 'spartan',
    providers: [
      { value: 'spartan', label: 'Spartan NG (shadcn para Angular)' },
      { value: 'material', label: 'Angular Material' }
    ]
  },
  infra: {
    name: 'infra',
    label: 'Infraestructura',
    default: 'none',
    // los proveedores reales (azure, lowcost, aws, gcp) llegan en las specs C1-C4
    providers: [{ value: 'none', label: 'Ninguna (sin adapters de nube ni IaC)' }]
  },
  auth: {
    name: 'auth',
    label: 'Autenticación',
    default: 'none',
    providers: [
      { value: 'none', label: 'Ninguna (app abierta)' },
      {
        value: 'single-tenant',
        label: 'Single-tenant (sesión por cookie, invitaciones, roles)',
        description: authPlugin.description,
        requires: { database: 'postgres' },
        plugin: authPlugin
      }
    ]
  }
}

/** Portador de restricciones: proveedor de ranura o plugin aditivo con manifiesto `requires`. */
interface Requirer {
  name: string
  requires?: Record<string, string>
}

/**
 * Resuelve la selección completa (aplicando defaults) y aplica las restricciones
 * `requires` — tanto las de los proveedores elegidos como las de los plugins
 * aditivos — ANTES de emitir un solo fichero.
 */
export function validateCombination(selection: Record<string, string | undefined>, plugins: Requirer[] = []): void {
  const resolved: Record<string, string> = {}
  const providers: Requirer[] = []
  for (const slot of Object.values(SLOTS)) {
    const provider = selectProvider(slot.name, selection[slot.name])
    resolved[slot.name] = provider.value
    providers.push({ name: `${slot.name}=${provider.value}`, requires: provider.requires })
  }
  for (const requirer of [...providers, ...plugins]) {
    for (const [slotName, required] of Object.entries(requirer.requires ?? {})) {
      if (resolved[slotName] !== required) {
        throw new Error(
          `'${requirer.name}' requires ${slotName}=${required} and the selection targets ${resolved[slotName]}. ` +
            `Change it or use --${slotName}=${required}.`
        )
      }
    }
  }
}

export function selectProvider(slotName: string, value: string | undefined): SlotProvider {
  const slot = SLOTS[slotName]
  if (!slot) {
    throw new Error(`Unknown slot '${slotName}'. Registered slots: ${Object.keys(SLOTS).join(', ')}`)
  }
  const chosen = value ?? slot.default
  const provider = slot.providers.find(p => p.value === chosen)
  if (!provider) {
    throw new Error(`Unknown ${slot.name} '${chosen}'. Available: ${slot.providers.map(p => p.value).join(', ')}`)
  }
  return provider
}

/** Los manifiestos de emisión de los proveedores elegidos, en el orden del registro. */
export function slotPlugins(selection: Record<string, string | undefined>): AppPlugin[] {
  return Object.values(SLOTS)
    .map(slot => selectProvider(slot.name, selection[slot.name]).plugin)
    .filter((plugin): plugin is AppPlugin => plugin !== undefined)
}

/**
 * Compatibilidad: `--plugins=auth` era la forma antigua de pedir autenticación.
 * Se traduce a la ranura con aviso de deprecación para no romper comandos guardados.
 * Un `--auth` explícito manda sobre el nombre heredado.
 */
export function normalizeLegacyPlugins(
  plugins: string | undefined,
  auth: string | undefined
): { plugins: string | undefined; auth: string | undefined } {
  if (!plugins?.includes('auth')) {
    return { plugins, auth }
  }
  const remaining = plugins
    .split(',')
    .map(n => n.trim())
    .filter(n => n !== 'auth')
    .join(',')
  console.warn('ℹ --plugins=auth está deprecado: auth es una ranura. Usa --auth=single-tenant.')
  return { plugins: remaining, auth: auth ?? 'single-tenant' }
}
