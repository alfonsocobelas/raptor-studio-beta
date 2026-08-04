import { readFileSync } from 'fs'
import * as path from 'path'

/**
 * Manifiesto de opciones del generador (spec 23). La verdad vive en el registro de ranuras
 * del acelerador y se publica en `tools/slots.json`; el estudio lo LEE y no redeclara nada:
 * antes las mismas listas estaban copiadas a mano aquí y en el wizard, y añadir un
 * proveedor obligaba a tocar tres sitios.
 */
export interface ManifestProvider {
  value: string
  label: string
  description?: string
  /** Restricciones contra otras ranuras: el wizard deshabilita lo que las viola */
  requires?: Record<string, string>
}

export interface ManifestSlot {
  name: string
  label: string
  default: string
  providers: ManifestProvider[]
}

export interface SlotsManifest {
  slots: ManifestSlot[]
  plugins: { name: string; description: string }[]
}

export const SLOTS_MANIFEST_PATH = 'tools/slots.json'

export function loadSlotsManifest(acceleratorRoot: string): SlotsManifest {
  const file = path.join(acceleratorRoot, SLOTS_MANIFEST_PATH)
  let raw: string
  try {
    raw = readFileSync(file, 'utf-8')
  } catch {
    throw new Error(`No se encuentra ${SLOTS_MANIFEST_PATH} en ${acceleratorRoot}: regenéralo con 'npm run slots'.`)
  }
  const parsed: unknown = JSON.parse(raw)
  if (!isManifest(parsed)) {
    throw new Error(`El manifiesto ${SLOTS_MANIFEST_PATH} no tiene la forma esperada (slots[] + plugins[]).`)
  }
  return parsed
}

function isManifest(value: unknown): value is SlotsManifest {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as { slots?: unknown; plugins?: unknown }
  return (
    Array.isArray(candidate.slots) && Array.isArray(candidate.plugins) && candidate.slots.every(slot => isSlot(slot))
  )
}

function isSlot(value: unknown): value is ManifestSlot {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as {
    name?: unknown
    default?: unknown
    providers?: unknown
  }
  return (
    typeof candidate.name === 'string' && typeof candidate.default === 'string' && Array.isArray(candidate.providers)
  )
}

/**
 * Valida en el BORDE la selección que llega del navegador: ranuras y proveedores existentes,
 * plugins registrados y restricciones `requires` satisfechas. Mismo gate que el generador,
 * contado antes de lanzar un proceso.
 */
export function validateSelection(manifest: SlotsManifest, selection: Record<string, string>, plugins: string[]): void {
  const resolved: Record<string, string> = {}
  for (const slot of manifest.slots) {
    resolved[slot.name] = slot.default
  }

  for (const [name, value] of Object.entries(selection)) {
    const slot = manifest.slots.find(candidate => candidate.name === name)
    if (!slot) {
      throw new Error(`Ranura desconocida '${name}'. Disponibles: ${manifest.slots.map(s => s.name).join(', ')}`)
    }
    if (!slot.providers.some(provider => provider.value === value)) {
      throw new Error(
        `Valor inválido para ${slot.name}: '${value}'. Disponibles: ${slot.providers.map(p => p.value).join(', ')}`
      )
    }
    resolved[name] = value
  }

  for (const plugin of plugins) {
    if (!manifest.plugins.some(candidate => candidate.name === plugin)) {
      throw new Error(`Plugin inválido '${plugin}'. Disponibles: ${manifest.plugins.map(p => p.name).join(', ')}`)
    }
  }

  for (const slot of manifest.slots) {
    const provider = slot.providers.find(candidate => candidate.value === resolved[slot.name])
    for (const [required, value] of Object.entries(provider?.requires ?? {})) {
      if (resolved[required] !== value) {
        throw new Error(
          `${slot.name}=${provider?.value} exige ${required}=${value} y la selección usa ${resolved[required]}.`
        )
      }
    }
  }
}
