import type { AppDefinition } from '@acc/schema'

/**
 * El wizard no sabe qué opciones existen: se las dice el MANIFIESTO que sirve
 * `GET /studio/slots`, generado desde el registro de ranuras del acelerador (spec 23).
 * Antes estas listas estaban copiadas a mano aquí, en el borde del studio-api y en el
 * `schema.json` del generador — tres sitios que había que tocar por cada proveedor nuevo.
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

export interface WizardOptions {
  name: string
  /** Ranura → proveedor elegido */
  slots: Record<string, string>
  plugins: string[]
}

/** El artefacto que consume `--appFile`: el schema vivo con el nombre elegido. */
export function buildAppFile(definition: AppDefinition, name: string): { filename: string; content: string } {
  return {
    filename: `${name}.app.json`,
    content: JSON.stringify({ ...definition, name }, null, 2)
  }
}

export function defaultSelection(manifest: SlotsManifest): Record<string, string> {
  return Object.fromEntries(manifest.slots.map(slot => [slot.name, slot.default]))
}

/** Una ranura con un solo proveedor no se pregunta: no hay nada que elegir. */
export function choosableSlots(manifest: SlotsManifest): ManifestSlot[] {
  return manifest.slots.filter(slot => slot.providers.length > 1)
}

/** ¿Choca este proveedor con la selección actual? Mismo criterio que el gate del generador. */
export function isDisabled(provider: ManifestProvider, selection: Record<string, string>): boolean {
  return Object.entries(provider.requires ?? {}).some(([slot, required]) => selection[slot] !== required)
}

export function buildCommand(manifest: SlotsManifest, options: WizardOptions): string {
  const plugins = options.plugins.length ? options.plugins.join(',') : 'none'
  return [
    `npx nx g @acc/generators:app ${options.name}`,
    `--appFile=${options.name}.app.json`,
    ...choosableSlots(manifest).map(slot => `--${slot.name}=${options.slots[slot.name] ?? slot.default}`),
    `--plugins=${plugins}`
  ].join(' ')
}
