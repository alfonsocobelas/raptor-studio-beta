import type { AppDefinition } from '@acc/schema'

/**
 * Opciones del wizard = opciones del generador de app (schema.json de
 * @acc/generators). Regla 7: aquí no se inventa nada — si el generador gana
 * una opción, se añade en ambos sitios.
 */
export interface WizardOptions {
  name: string
  ui: 'spartan' | 'material'
  database: 'postgres' | 'mongo'
  plugins: string[]
}

export const UI_OPTIONS: WizardOptions['ui'][] = ['spartan', 'material']
export const DATABASE_OPTIONS: WizardOptions['database'][] = ['postgres', 'mongo']
export const PLUGIN_OPTIONS = ['auth', 'email', 'observability']

/** El artefacto que consume `--appFile`: el schema vivo con el nombre elegido. */
export function buildAppFile(definition: AppDefinition, name: string): { filename: string; content: string } {
  return {
    filename: `${name}.app.json`,
    content: JSON.stringify({ ...definition, name }, null, 2)
  }
}

export function buildCommand(options: WizardOptions): string {
  const plugins = options.plugins.length ? options.plugins.join(',') : 'none'
  return [
    `npx nx g @acc/generators:app ${options.name}`,
    `--appFile=${options.name}.app.json`,
    `--ui=${options.ui}`,
    `--database=${options.database}`,
    `--plugins=${plugins}`
  ].join(' ')
}
