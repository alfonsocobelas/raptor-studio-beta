import { validateSelection, type SlotsManifest } from './slots-manifest'

/**
 * Construcción VALIDADA del argv del generador. Entrada externa (nombre, selección de
 * ranuras, plugins) validada en el borde CONTRA EL MANIFIESTO del acelerador — el estudio
 * no redeclara qué opciones existen (spec 23); los argumentos van separados a execFile,
 * nunca por shell: aquí se corta cualquier inyección.
 */

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const RELATIVE_DIR = /^[a-z0-9][a-z0-9/_-]*$/i

export interface GenerateArgsInput {
  manifest: SlotsManifest
  name: string
  /** Ranura → proveedor elegido; lo que falte toma el default del manifiesto */
  slots: Record<string, string>
  plugins: string[]
  appFile: string
  skipInstall?: boolean
  directory?: string
}

export function buildGeneratorArgs(input: GenerateArgsInput): string[] {
  if (!KEBAB.test(input.name)) throw new Error(`name debe ser kebab-case: '${input.name}'`)
  validateSelection(input.manifest, input.slots, input.plugins)
  if (input.directory !== undefined && (!RELATIVE_DIR.test(input.directory) || input.directory.includes('..'))) {
    throw new Error(`directory debe ser una ruta relativa dentro del workspace: '${input.directory}'`)
  }

  // una ranura con un solo proveedor no se pregunta ni se pasa: no hay nada que elegir
  const slotFlags = input.manifest.slots
    .filter(slot => slot.providers.length > 1)
    .map(slot => `--${slot.name}=${input.slots[slot.name] ?? slot.default}`)

  return [
    'nx',
    'g',
    '@raptor/generators:app',
    input.name,
    `--appFile=${input.appFile}`,
    ...slotFlags,
    `--plugins=${input.plugins.length ? input.plugins.join(',') : 'none'}`,
    '--no-interactive',
    ...(input.skipInstall ? ['--skipInstall'] : []),
    ...(input.directory ? [`--directory=${input.directory}`] : [])
  ]
}

/**
 * El entorno con el que se lanza `npx nx`. Nx aísla cada plugin en un worker hijo y lo mata si
 * no responde en 10 segundos; en una máquina cargada eso pasa ANTES de entrar en el generador,
 * y el error habla de plugins de Nx, no del acelerador, así que parece un fallo de lo que se
 * estaba generando. El propio Nx desactiva el aislamiento cuando detecta que corre dentro de un
 * agente de IA: el estudio, que lanza generaciones largas desde un servidor, tiene el mismo
 * motivo. Si quien arrancó el estudio lo pidió explícitamente, manda su decisión.
 */
export function generatorEnv(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...base, NX_ISOLATE_PLUGINS: base['NX_ISOLATE_PLUGINS'] ?? 'false' }
}
