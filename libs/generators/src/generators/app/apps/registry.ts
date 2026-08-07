import type { AppDefinition } from '@acc/schema'
import { demo } from './demo.app'
import { boutique } from './boutique.app'
import { golden } from './golden.app'

/**
 * Registro estático de app-schemas — el lugar único donde se declara la composición
 * de una app (páginas, orden, widgets). Mismo patrón bundle-safe que el registro de
 * modelos: el plugin va empaquetado y un escaneo de directorio no sobreviviría al build.
 */
export const APPS: Record<string, AppDefinition> = {
  demo,
  boutique,
  golden
}

export function selectApp(name: string): AppDefinition {
  const app = APPS[name]
  if (!app) {
    throw new Error(`Unknown app '${name}'. Available apps: ${Object.keys(APPS).join(', ')}`)
  }
  return app
}
