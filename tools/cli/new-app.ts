/* eslint-disable no-console */
import { execFileSync } from 'child_process'
import { MODELS } from '../../libs/generators/src/generators/resource/models/registry'
import { PLUGINS } from '../../libs/generators/src/generators/app/plugins/registry'

// enquirer no publica tipos completos: se tipa lo mínimo que usamos.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prompt } = require('enquirer') as {
  prompt<T>(questions: unknown): Promise<T>
}

interface CliArgs {
  name?: string
  models?: string
  ui?: string
  plugins?: string
  dashboard?: boolean
  skipInstall: boolean
}

/**
 * CLI de creación de apps: `npm run new`. Pregunta lo mismo que el formulario del
 * generador pero con selección múltiple real (modelos y plugins con checkbox), y
 * delega en `nx g @raptor/generators:app`. Cualquier respuesta puede venir por flag
 * (--name, --models, --ui, --plugins, --skip-install) para uso no interactivo/CI.
 *
 * Las migraciones no se preguntan: vienen de fábrica (decisión 2026-07-31).
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  const name =
    args.name ??
    (
      await prompt<{ name: string }>({
        type: 'input',
        name: 'name',
        message: '¿Cómo se llama la aplicación?',
        validate: (value: string) => (/^[a-z][a-z0-9-]*$/.test(value) ? true : 'kebab-case: letras, números y guiones')
      })
    ).name

  const models =
    args.models?.split(',').map(m => m.trim()) ??
    (
      await prompt<{ models: string[] }>({
        type: 'multiselect',
        name: 'models',
        message: '¿Qué modelos incluye? (espacio para marcar, enter para confirmar)',
        choices: Object.values(MODELS).map(model => ({
          name: model.name,
          message: `${model.labels?.plural ?? model.plural} (${model.name}, contexto ${model.context})`
        })),
        validate: (value: string[]) => (value.length ? true : 'Elige al menos un modelo')
      })
    ).models

  const ui =
    args.ui ??
    (
      await prompt<{ ui: string }>({
        type: 'select',
        name: 'ui',
        message: '¿Qué librería de componentes?',
        choices: [
          { name: 'spartan', message: 'Spartan NG (shadcn para Angular) — piel por defecto' },
          { name: 'material', message: 'Angular Material — disponible, congelada (ADR-003)' }
        ]
      })
    ).ui

  const plugins =
    args.plugins?.split(',').map(p => p.trim()).filter(p => p && p !== 'none') ??
    (
      await prompt<{ plugins: string[] }>({
        type: 'multiselect',
        name: 'plugins',
        message: 'Plugins opcionales (las migraciones ya vienen de fábrica)',
        choices: Object.values(PLUGINS).map(plugin => ({ name: plugin.name, message: `${plugin.name} — ${plugin.description}` }))
      })
    ).plugins

  const dashboard =
    args.dashboard ??
    (
      await prompt<{ dashboard: boolean }>({
        type: 'confirm',
        name: 'dashboard',
        message: '¿Añado un dashboard de KPIs como pantalla de inicio? (un total por recurso)'
      })
    ).dashboard

  // email envía a través del puerto EmailSender que instala auth
  if (plugins.includes('email') && !plugins.includes('auth')) {
    console.log('ℹ email requiere auth: se añade automáticamente.')
    plugins.push('auth')
  }

  const flags = [
    `@raptor/generators:app`,
    name,
    `--models=${models.join(',')}`,
    `--ui=${ui}`,
    `--plugins=${plugins.length ? plugins.join(',') : 'none'}`,
    `--directory=apps/${name}`,
    '--no-interactive'
  ]
  if (dashboard) {
    flags.push('--dashboard')
  }
  if (args.skipInstall) {
    flags.push('--skipInstall')
  }

  console.log(`\n▶ nx g ${flags.join(' ')}\n`)
  execFileSync('npx', ['nx', 'g', ...flags], {
    stdio: 'inherit',
    // el type-stripping nativo de Node 24 rompe __dirname en los generadores
    env: { ...process.env, NX_PREFER_NODE_STRIP_TYPES: 'false' }
  })
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { skipInstall: false }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    if (flag === '--skip-install') args.skipInstall = true
    else if (flag === '--dashboard') args.dashboard = true
    else if (flag === '--no-dashboard') args.dashboard = false
    else if (flag === '--name') args.name = argv[++i]
    else if (flag === '--models') args.models = argv[++i]
    else if (flag === '--ui') args.ui = argv[++i]
    else if (flag === '--plugins') args.plugins = argv[++i]
    else {
      console.error(`Flag desconocida: ${flag}`)
      process.exit(1)
    }
  }
  return args
}

main().catch((error: unknown) => {
  // Ctrl+C en enquirer rechaza con '' — salida silenciosa, no es un error
  if (error === '') {
    process.exit(130)
  }
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
