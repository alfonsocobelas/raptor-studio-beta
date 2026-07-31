import { authPlugin } from './auth.plugin'
import { emailPlugin } from './email.plugin'
import { observabilityPlugin } from './observability.plugin'
import { migrationsPlugin } from './migrations.plugin'
import type { AppPlugin } from './plugin'

/**
 * Plugins disponibles. Añadir uno aquí basta para que aparezca en el formulario
 * del generador y se pueda ensamblar en la app.
 */
export const PLUGINS: Record<string, AppPlugin> = {
  auth: authPlugin,
  email: emailPlugin,
  observability: observabilityPlugin
}

export function selectPlugins(names: string | undefined): AppPlugin[] {
  if (!names?.trim()) {
    return []
  }
  return names
    .split(',')
    .map(n => n.trim())
    .filter(n => n && n !== 'none')
    .filter(n => {
      // las migraciones vienen de fábrica desde 2026-07-31: se tolera el nombre por compatibilidad
      if (n === 'migrations') {
        console.warn('ℹ migrations ya viene de fábrica; no hace falta pedirla como plugin.')
        return false
      }
      return true
    })
    .map(n => {
      const plugin = PLUGINS[n]
      if (!plugin) {
        throw new Error(`Unknown plugin '${n}'. Available: ${Object.keys(PLUGINS).join(', ')}`)
      }
      return plugin
    })
}
