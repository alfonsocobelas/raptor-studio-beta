import { authPlugin } from './auth.plugin'
import { redisSessionPlugin } from './redis-session.plugin'
import { INFRA_PROVIDERS } from '../infra/providers'
import { DESIGN_PRESETS, DEFAULT_DESIGN } from '../design/presets'
import type { AppPlugin } from './plugin'
import type { DatabaseEngine } from '../database'

/**
 * Ranuras de capacidad (spec 23): una ranura es una decisión excluyente de la app
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

/** Librería de componentes del frontend emitido (la consume el kernel frontend). */
export type UiLibrary = 'spartan'

/** Almacén de sesiones del emitido (spec 55). Solo tiene efecto con auth single-tenant. */
export type SessionStore = 'postgres' | 'redis'

/**
 * Proveedores del almacén de sesiones. El de postgres no lleva manifiesto: la
 * persistencia TypeORM la emite el propio plugin de auth (assets-auth-session-typeorm).
 * El de redis trae la infra compartida (cliente, config, health) en su manifiesto.
 */
const SESSION_STORE_PROVIDERS: readonly (SlotProvider & { value: SessionStore })[] = [
  { value: 'postgres', label: 'PostgreSQL (tabla iam.session)' },
  {
    value: 'redis',
    label: 'Redis (multi-réplica, TTL nativo)',
    description: redisSessionPlugin.description,
    // sin auth no hay sesiones que almacenar; validateCombination lo corta antes de emitir
    requires: { auth: 'single-tenant' },
    plugin: redisSessionPlugin
  }
]

/** Proveedores de persistencia, tipados con el motor: de aquí sale `selectEngine` sin casts. */
const DATABASE_PROVIDERS: readonly (SlotProvider & { value: DatabaseEngine })[] = [
  { value: 'postgres', label: 'PostgreSQL (TypeORM)' },
  { value: 'mongo', label: 'MongoDB (Mongoose)' }
]

/**
 * Ídem para la piel: el tipo concreto sobrevive a la resolución.
 *
 * Un solo proveedor a propósito (spec 36): la piel material se retiró tras medir que emitía
 * apps indistinguibles de las de spartan, y la variedad visual la lleva la ranura `design`.
 * La ranura se conserva porque es el punto de re-entrada si un cliente exige otra librería;
 * con un único proveedor el wizard no la pregunta.
 */
const UI_PROVIDERS: readonly (SlotProvider & { value: UiLibrary })[] = [
  { value: 'spartan', label: 'Spartan NG (shadcn para Angular)' }
]

export const SLOTS: Record<string, Slot> = {
  database: {
    name: 'database',
    label: 'Base de datos',
    default: 'postgres',
    providers: [...DATABASE_PROVIDERS]
  },
  ui: {
    name: 'ui',
    label: 'Componentes',
    default: 'spartan',
    providers: [...UI_PROVIDERS]
  },
  design: {
    name: 'design',
    // «Preset visual» y no «Diseño»: en el estudio un diseño es el schema que se dibuja, y dos
    // cosas distintas con el mismo nombre en la misma pantalla se confunden (Alfonso, 2026-08-10)
    label: 'Preset visual',
    default: DEFAULT_DESIGN,
    // los presets salen de su registro (app/design/presets.ts): añadir uno allí basta
    providers: DESIGN_PRESETS.map(({ id, label, description }) => ({ value: id, label, description }))
  },
  infra: {
    name: 'infra',
    label: 'Infraestructura',
    default: 'none',
    // los proveedores salen de sus manifiestos (app/infra/providers.ts): añadir uno allí basta
    providers: INFRA_PROVIDERS.map(({ value, label, description }) => ({ value, label, description }))
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
  },
  sessionStore: {
    name: 'sessionStore',
    label: 'Almacén de sesiones',
    default: 'postgres',
    providers: [...SESSION_STORE_PROVIDERS]
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

/** Resuelve un valor contra una lista de proveedores conservando su tipo concreto. */
function resolve<T extends SlotProvider>(slot: Slot, providers: readonly T[], value: string | undefined): T {
  const chosen = value ?? slot.default
  const provider = providers.find(p => p.value === chosen)
  if (!provider) {
    throw new Error(`Unknown ${slot.name} '${chosen}'. Available: ${providers.map(p => p.value).join(', ')}`)
  }
  return provider
}

export function selectProvider(slotName: string, value: string | undefined): SlotProvider {
  const slot = SLOTS[slotName]
  if (!slot) {
    throw new Error(`Unknown slot '${slotName}'. Registered slots: ${Object.keys(SLOTS).join(', ')}`)
  }
  return resolve(slot, slot.providers, value)
}

/** El motor de persistencia elegido, tipado. Sustituye al validador ad-hoc `selectDatabase`. */
export function selectEngine(value: string | undefined): DatabaseEngine {
  return resolve(SLOTS['database'], DATABASE_PROVIDERS, value).value
}

/** La piel elegida, tipada. Antes era un `?? 'spartan'` sin validación. */
export function selectUi(value: string | undefined): UiLibrary {
  return resolve(SLOTS['ui'], UI_PROVIDERS, value).value
}

/** El almacén de sesiones elegido, tipado (spec 55). */
export function selectSessionStore(value: string | undefined): SessionStore {
  return resolve(SLOTS['sessionStore'], SESSION_STORE_PROVIDERS, value).value
}

/** Los manifiestos de emisión de los proveedores elegidos, en el orden del registro. */
export function slotPlugins(selection: Record<string, string | undefined>): AppPlugin[] {
  return Object.values(SLOTS)
    .map(slot => selectProvider(slot.name, selection[slot.name]).plugin)
    .filter((plugin): plugin is AppPlugin => plugin !== undefined)
}

/** Nombres de plugin que hoy son ranuras: se traducen para no romper comandos guardados. */
const LEGACY_SLOT_NAMES: Record<string, { slot: string; provider: string }> = {
  auth: { slot: 'auth', provider: 'single-tenant' },
  observability: { slot: 'infra', provider: 'azure' }
}

/**
 * Compatibilidad: `--plugins=auth` y `--plugins=observability` eran la forma antigua de pedir
 * autenticación y telemetría. Se traducen a su ranura con aviso de deprecación.
 *
 * Un valor de ranura distinto del default manda sobre el nombre heredado. El default NO cuenta
 * como elección: Nx rellena los defaults del `schema.json` antes de llamar al generador, así que
 * por CLI la opción llega siempre con valor y `undefined` solo se ve en tests. Consecuencia
 * asumida: `--plugins=auth --auth=none` emite auth (indistinguible del default).
 */
export function normalizeLegacyPlugins(
  plugins: string | undefined,
  selection: Record<string, string | undefined> = {}
): { plugins: string | undefined; selection: Record<string, string | undefined> } {
  const names = (plugins ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
  const legacy = names.filter(name => name in LEGACY_SLOT_NAMES)
  if (!legacy.length) {
    return { plugins, selection }
  }

  const translated = { ...selection }
  for (const name of legacy) {
    const { slot, provider } = LEGACY_SLOT_NAMES[name]
    console.warn(`ℹ --plugins=${name} está deprecado: ${slot} es una ranura. Usa --${slot}=${provider}.`)
    const chosenExplicitly = translated[slot] !== undefined && translated[slot] !== SLOTS[slot].default
    if (!chosenExplicitly) {
      translated[slot] = provider
    }
  }

  return { plugins: names.filter(name => !(name in LEGACY_SLOT_NAMES)).join(','), selection: translated }
}
