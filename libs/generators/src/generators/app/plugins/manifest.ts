import { PLUGINS } from './registry'
import { SLOTS } from './slots'

/**
 * Manifiesto de opciones del generador (spec 23): la proyección SERIALIZABLE del registro
 * de ranuras y plugins. Es lo único que el estudio necesita para dibujar su formulario y
 * validar en el borde, así que las opciones dejan de estar copiadas a mano en tres sitios.
 *
 * Lo que emite cada proveedor (assets, dependencias, `apply`) NO viaja: eso solo lo
 * entiende el generador. Aquí van datos y nada más.
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

export function buildSlotsManifest(): SlotsManifest {
  return {
    slots: Object.values(SLOTS).map(slot => ({
      name: slot.name,
      label: slot.label,
      default: slot.default,
      // los proveedores internos (spec 58) no viajan: el estudio no debe ofrecerlos
      providers: slot.providers.filter(provider => !provider.internal).map(provider => ({
        value: provider.value,
        label: provider.label,
        ...(provider.description ? { description: provider.description } : {}),
        ...(provider.requires ? { requires: provider.requires } : {})
      }))
    })),
    plugins: Object.values(PLUGINS).map(plugin => ({ name: plugin.name, description: plugin.description }))
  }
}

/** El JSON commiteado, con salto de línea final (prettier). */
export function renderSlotsManifest(): string {
  return `${JSON.stringify(buildSlotsManifest(), null, 2)}\n`
}
