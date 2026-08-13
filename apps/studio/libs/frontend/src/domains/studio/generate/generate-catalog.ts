import {
  choosableSlots,
  isDisabled,
  type ManifestProvider,
  type ManifestSlot,
  type SlotsManifest
} from './wizard-command'

/**
 * La pantalla «Antes de generar» enseña más opciones de las que el acelerador tiene hoy:
 * las que faltan salen apagadas con «Próximamente». Eso NO significa que el estudio decida
 * qué existe —eso lo sigue diciendo el manifiesto (spec 23)—: el catálogo solo aporta la
 * REDACCIÓN de cada tarjeta y la lista de lo que aún no está.
 *
 * De ahí la regla de la fusión: disponible ⇔ el manifiesto lo publica. Añadir un adapter a
 * `tools/slots.json` enciende su tarjeta sin tocar este fichero ni el componente.
 */
export interface CatalogCard {
  slot: string
  value: string
  title: string
  hint: string
  /** ¿Lo publica el manifiesto? Si no, es una promesa, no una opción. */
  available: boolean
  /** No se puede elegir: o no existe, o choca con otra ranura ya elegida. */
  disabled: boolean
  /** Por qué no se puede elegir. Ausente cuando se puede. */
  reason?: string
}

export interface CatalogGroup {
  slot: string
  heading: string
  subheading?: string
  cards: CatalogCard[]
}

export interface Catalog {
  groups: CatalogGroup[]
  addons: CatalogCard[]
}

interface CatalogEntry {
  value: string
  title: string
  hint: string
}

interface GroupCopy {
  heading: string
  subheading?: string
  entries: CatalogEntry[]
}

const SOON = 'Próximamente'

/**
 * El preset visual no se pregunta aquí: manda el que se ve en el lienzo (lo que ves es lo
 * que se genera), y la pantalla lo enseña en el raíl, de solo lectura.
 */
const HIDDEN_SLOTS = ['design']

const GROUPS: Record<string, GroupCopy> = {
  infra: {
    heading: '¿Dónde quieres alojarla?',
    subheading: 'Puedes cambiar de proveedor más adelante sin rehacer la aplicación.',
    entries: [
      { value: 'none', title: 'Sin nube', hint: 'Solo el código; el despliegue lo montas tú' },
      { value: 'azure', title: 'Azure', hint: 'Key Vault, Blob Storage y App Insights' },
      { value: 'aws', title: 'AWS', hint: 'Secrets Manager, S3 y CloudWatch' },
      { value: 'gcp', title: 'Google Cloud', hint: 'Secret Manager, Cloud Storage y Logging' }
    ]
  },
  database: {
    heading: 'Base de datos',
    entries: [
      { value: 'postgres', title: 'PostgreSQL', hint: 'Tus tablas tienen relaciones: Postgres encaja mejor' },
      { value: 'mongo', title: 'MongoDB', hint: 'Documentos sin esquema fijo' }
    ]
  },
  auth: {
    heading: 'Autenticación',
    entries: [
      { value: 'none', title: 'Sin autenticación', hint: 'Aplicación abierta, sin login' },
      { value: 'single-tenant', title: 'Single-tenant', hint: 'Sesión por cookie, invitaciones y roles' },
      { value: 'multi-tenant', title: 'Multi-tenant', hint: 'Si vas a vender la aplicación a otros negocios' }
    ]
  }
}

/** Alta disponibilidad se retiró a propósito (Alfonso, 2026-08-13): no se ofrece ni apagada. */
const ADDONS: CatalogEntry[] = [
  { value: 'email', title: 'Correo saliente', hint: 'Avisos y recuperación de contraseña' },
  { value: 'redis', title: 'Redis para sesiones', hint: 'Sesiones y caché fuera del proceso' },
  { value: 'observability', title: 'Observabilidad', hint: 'Logs, métricas y trazas' },
  { value: 'object-storage', title: 'Almacenamiento de objetos', hint: 'Ficheros y adjuntos fuera de la base' },
  { value: 'custom-domain', title: 'Dominio propio', hint: 'Con su certificado' }
]

export function mergeCatalog(manifest: SlotsManifest, selection: Record<string, string>): Catalog {
  // el orden de la pantalla es el del catálogo (alojamiento primero, a lo ancho), no el del
  // manifiesto, que lista las ranuras como le convino al generador
  const order = Object.keys(GROUPS)
  const groups = choosableSlots(manifest)
    .filter(slot => !HIDDEN_SLOTS.includes(slot.name))
    .sort((a, b) => rank(order, a.name) - rank(order, b.name))
    .map(slot => toGroup(slot, manifest, selection))

  return { groups, addons: toAddons(manifest) }
}

/** Lo que el catálogo no ordena va al final, en el orden del manifiesto. */
function rank(order: string[], slot: string): number {
  const index = order.indexOf(slot)
  return index === -1 ? order.length : index
}

function toGroup(slot: ManifestSlot, manifest: SlotsManifest, selection: Record<string, string>): CatalogGroup {
  const copy = GROUPS[slot.name]
  const entries = copy?.entries ?? []
  const known = entries.map(entry => toCard(slot, entry, manifest, selection))
  // lo que publica el manifiesto y el catálogo no conoce va al final, con sus propias palabras
  const rest = slot.providers
    .filter(provider => !entries.some(entry => entry.value === provider.value))
    .map(provider =>
      toCard(
        slot,
        { value: provider.value, title: provider.label, hint: provider.description ?? '' },
        manifest,
        selection
      )
    )

  return {
    slot: slot.name,
    heading: copy?.heading ?? slot.label,
    ...(copy?.subheading ? { subheading: copy.subheading } : {}),
    cards: [...known, ...rest]
  }
}

function toCard(
  slot: ManifestSlot,
  entry: CatalogEntry,
  manifest: SlotsManifest,
  selection: Record<string, string>
): CatalogCard {
  const provider = slot.providers.find(candidate => candidate.value === entry.value)
  const blocked = provider ? isDisabled(provider, selection) : false
  const reason = !provider ? SOON : blocked ? requirementOf(provider, manifest) : undefined

  return {
    slot: slot.name,
    value: entry.value,
    title: entry.title,
    hint: entry.hint,
    available: provider !== undefined,
    disabled: provider === undefined || blocked,
    ...(reason ? { reason } : {})
  }
}

function toAddons(manifest: SlotsManifest): CatalogCard[] {
  const known = ADDONS.map(entry =>
    toAddon(
      entry,
      manifest.plugins.some(plugin => plugin.name === entry.value)
    )
  )
  const rest = manifest.plugins
    .filter(plugin => !ADDONS.some(entry => entry.value === plugin.name))
    .map(plugin => toAddon({ value: plugin.name, title: plugin.name, hint: plugin.description }, true))

  return [...known, ...rest]
}

function toAddon(entry: CatalogEntry, available: boolean): CatalogCard {
  return {
    slot: 'plugin',
    value: entry.value,
    title: entry.title,
    hint: entry.hint,
    available,
    disabled: !available,
    ...(available ? {} : { reason: SOON })
  }
}

/** «Requiere Base de datos: PostgreSQL» — con las etiquetas del manifiesto, no con sus claves. */
function requirementOf(provider: ManifestProvider, manifest: SlotsManifest): string {
  return Object.entries(provider.requires ?? {})
    .map(([slotName, value]) => {
      const slot = manifest.slots.find(candidate => candidate.name === slotName)
      const required = slot?.providers.find(candidate => candidate.value === value)
      return `Requiere ${slot?.label ?? slotName}: ${required?.label ?? value}`
    })
    .join(', ')
}
