/**
 * Construcción VALIDADA del argv del generador. Entrada externa (nombre,
 * opciones) validada en el borde; los argumentos van separados a execFile,
 * nunca por shell — aquí se corta cualquier inyección.
 */

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const RELATIVE_DIR = /^[a-z0-9][a-z0-9/_-]*$/i

export const UI_VALUES = ['spartan', 'material'] as const
export const DATABASE_VALUES = ['postgres', 'mongo'] as const
export const PLUGIN_VALUES = ['auth', 'email', 'observability'] as const

export interface GenerateArgsInput {
  name: string
  ui: string
  database: string
  plugins: string[]
  appFile: string
  skipInstall?: boolean
  directory?: string
}

export function buildGeneratorArgs(input: GenerateArgsInput): string[] {
  if (!KEBAB.test(input.name)) throw new Error(`name debe ser kebab-case: '${input.name}'`)
  if (!(UI_VALUES as readonly string[]).includes(input.ui)) throw new Error(`ui inválida: '${input.ui}'`)
  if (!(DATABASE_VALUES as readonly string[]).includes(input.database)) {
    throw new Error(`database inválida: '${input.database}'`)
  }
  for (const plugin of input.plugins) {
    if (!(PLUGIN_VALUES as readonly string[]).includes(plugin)) throw new Error(`plugin inválido: '${plugin}'`)
  }
  if (input.directory !== undefined && (!RELATIVE_DIR.test(input.directory) || input.directory.includes('..'))) {
    throw new Error(`directory debe ser una ruta relativa dentro del workspace: '${input.directory}'`)
  }

  return [
    'nx',
    'g',
    '@acc/generators:app',
    input.name,
    `--appFile=${input.appFile}`,
    `--ui=${input.ui}`,
    `--database=${input.database}`,
    `--plugins=${input.plugins.length ? input.plugins.join(',') : 'none'}`,
    '--no-interactive',
    ...(input.skipInstall ? ['--skipInstall'] : []),
    ...(input.directory ? [`--directory=${input.directory}`] : [])
  ]
}
