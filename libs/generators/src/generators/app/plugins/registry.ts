import { migrationsPlugin } from './migrations.plugin'
import type { AppPlugin } from './plugin'

/**
 * Plugins disponibles. Añadir uno aquí basta para que aparezca en el formulario
 * del generador y se pueda ensamblar en la app.
 */
export const PLUGINS: Record<string, AppPlugin> = {
  migrations: migrationsPlugin
}

export function selectPlugins(names: string | undefined): AppPlugin[] {
  if (!names?.trim()) {
    return []
  }
  return names
    .split(',')
    .map(n => n.trim())
    .filter(n => n && n !== 'none')
    .map(n => {
      const plugin = PLUGINS[n]
      if (!plugin) {
        throw new Error(`Unknown plugin '${n}'. Available: ${Object.keys(PLUGINS).join(', ')}`)
      }
      return plugin
    })
}
