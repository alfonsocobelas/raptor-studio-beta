import { formatFiles, generateFiles, names, type GeneratorCallback, type Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { selectModels } from '../resource/models/registry'
import kernelGenerator from '../kernel/kernel'
import rootGenerator from '../root/root'
import sharedDomainGenerator from '../shared-domain/shared-domain'
import frontendKernelGenerator from '../frontend-kernel/frontend-kernel'
import resourceGenerator from '../resource/resource'
import { selectPlugins } from './plugins/registry'
import type { AppPlugin, PluginContext } from './plugins/plugin'

export interface AppGeneratorSchema {
  name: string
  /** Comma-separated model names to include; defaults to the whole registry */
  models?: string
  /** Output directory; defaults to apps/<name> */
  directory?: string
  /** Component library the emitted frontend is built on */
  ui?: 'spartan' | 'material'
  /** Comma-separated plugins to assemble (migrations, auth) */
  plugins?: string
  /** Skip npm install and the Spartan UI materialisation (offline / CI) */
  skipInstall?: boolean
}

/** Import alias scope of every emitted project — fixed so the skeleton needs no interpolation. */
const SCOPE = '@app'
const SHARED_DOMAIN_ALIAS = `${SCOPE}/shared/domain`

/** Componentes Spartan que importan el kernel frontend y las features emitidas. */
const SPARTAN_COMPONENTS = [
  'alert-dialog',
  'badge',
  'button',
  'card',
  'checkbox',
  'dialog',
  'field',
  'input',
  'popover',
  'select',
  'separator',
  'sonner',
  'table',
  'tooltip'
]

/**
 * Proyecto arrancable de una pieza. Compone el resto de generadores en la estructura
 * canónica de la referencia y añade lo que convierte el código emitido en algo que
 * se ejecuta: package.json, tsconfig, docker local y de test, Makefile y shell Angular.
 *
 *   apps/backend-api      arranque de la API
 *   apps/frontend-app     shell Angular (menú lateral + rutas)
 *   libs/backend          kernel + un módulo por recurso
 *   libs/frontend         kernel Angular + una feature por recurso
 *   libs/shared/domain    DTOs compartidos
 *   libs/ui               componentes Spartan (los materializa @spartan-ng/cli al crear la app)
 *
 * El esqueleto se copia tal cual (sin EJS): solo se generan por plantilla los tres
 * ficheros que dependen de los modelos — rutas, menú y seed.
 */
export async function appGenerator(tree: Tree, options: AppGeneratorSchema): Promise<GeneratorCallback> {
  const appName = names(options.name).fileName
  const root = options.directory ?? path.join('apps', appName)
  const models = selectModels(options.models)
  const ui = options.ui ?? 'spartan'

  const backendSrc = path.join(root, 'libs/backend/src')
  const frontendSrc = path.join(root, 'libs/frontend/src')

  // 1. kernel backend + composition root
  await kernelGenerator(tree, {
    directory: backendSrc,
    models: options.models,
    sharedDomainAlias: SHARED_DOMAIN_ALIAS
  })
  await rootGenerator(tree, { directory: backendSrc, models: options.models })
  // el arranque vive en apps/backend-api; la config por entorno la emite el kernel
  tree.delete(path.join(backendSrc, 'main.ts'))
  tree.delete(path.join(backendSrc, 'environments'))

  // la config local debe apuntar al Postgres que levanta el compose emitido,
  // o `make local-setup` arrancaría contra una base que no existe
  alignLocalDatabase(tree, path.join(backendSrc, 'contexts/shared/infrastructure/config/environments/local.json'), appName)

  // 2. DTOs compartidos + kernel Angular
  await sharedDomainGenerator(tree, { directory: path.join(root, 'libs/shared/domain/src'), models: options.models })
  await frontendKernelGenerator(tree, { directory: frontendSrc, sharedDomainAlias: SHARED_DOMAIN_ALIAS, ui })

  // 3. un módulo por recurso, repartido al layout canónico
  for (const model of models) {
    const staging = path.join(root, '.gen', model.name)
    await resourceGenerator(tree, { name: model.name, directory: staging, sharedDomainAlias: SHARED_DOMAIN_ALIAS })

    relocate(tree, path.join(staging, 'backend'), path.join(backendSrc, 'contexts', model.context, 'modules', model.plural))
    // El canon separa el servicio del recurso (core/services, compartido) de su
    // pantalla (domains/…/features): los listados importan el servicio desde core.
    const staged = path.join(staging, 'frontend')
    relocate(tree, path.join(staged, 'mocks'), path.join(frontendSrc, 'core/services/mocks'))
    for (const file of tree.children(staged)) {
      if (!tree.isFile(path.join(staged, file))) {
        continue
      }
      const target = file.includes('.service.')
        ? path.join(frontendSrc, 'core/services')
        : path.join(frontendSrc, 'domains/admin/bounded-contexts', model.context, 'features', model.plural)
      move(tree, path.join(staged, file), path.join(target, file))
    }
    relocate(
      tree,
      path.join(staging, 'backend-tests'),
      path.join(root, 'libs/backend/tests/modules', model.plural, 'domain/mothers')
    )
    tree.delete(staging)
  }
  tree.delete(path.join(root, '.gen'))

  // 4. esqueleto: copia literal, sin plantillas
  copyVerbatim(tree, path.join(__dirname, 'files-skeleton'), root)

  // 5. lo único que depende de los modelos
  generateFiles(tree, path.join(__dirname, 'files'), root, {
    defaultRoute: routeOf(models[0]),
    routeEntries: models
      .map(
        model => `  {
    path: '${routeOf(model)}',
    loadComponent: () =>
      import(
        '${SCOPE}/frontend/domains/admin/bounded-contexts/${model.context}/features/${model.plural}/${model.plural}-list.component'
      ).then(m => m.${names(model.name).className}sListComponent)
  }`
      )
      .join(',\n'),
    navItems: models
      .map(model => `  { label: '${model.labels?.plural ?? model.plural}', route: '/${routeOf(model)}' }`)
      .join(',\n'),
    seedImports: models
      .map(model => {
        const n = names(model.name)
        const dir = `./contexts/${model.context}/modules/${model.plural}`
        return [
          `import { ${names(model.plural).className}Module } from '${dir}/${model.plural}.module'`,
          `import { Register${n.className}UseCase } from '${dir}/application/use-cases/register-${n.fileName}-usecase.service'`,
          `import { SEED_${names(model.plural).constantName} } from '${dir}/infrastructure/seed/local-seed.fixtures'`,
          `import { ${n.className}LocalSeeder } from '${dir}/infrastructure/seed/local-seeder'`
        ].join('\n')
      })
      .join('\n'),
    seedModules: models.map(model => `${names(model.plural).className}Module`).join(', '),
    seedRuns: models
      .map(model => {
        const n = names(model.name)
        const seeder = `new ${n.className}LocalSeeder(context.get(Register${n.className}UseCase))`
        return `    const ${model.plural}Summary = await ${seeder}.seed(SEED_${names(model.plural).constantName})
    console.log(
      \`[seed] ${model.plural}: +\${${model.plural}Summary.${model.plural}Created} created, \${${model.plural}Summary.${model.plural}Skipped} skipped\`
    )`
      })
      .join('\n'),
    tmpl: ''
  })

  // 6. plugins elegidos en el formulario (migraciones, auth…)
  const plugins = selectPlugins(options.plugins)
  const pluginContext: PluginContext = { root, appName, backendSrc, frontendSrc, models, scope: SCOPE }
  for (const plugin of plugins) {
    if (plugin.assets) {
      copyVerbatim(tree, path.join(__dirname, 'plugins', plugin.assets), root)
    }
    plugin.apply?.(tree, pluginContext)
  }
  applyPluginManifests(tree, root, plugins)

  await formatFiles(tree)

  // 7. tras volcar el árbol: dependencias y componentes Spartan (son un plugin, se
  //    descargan al crear la app en vez de vivir vendorizados en el acelerador)
  return () => {
    if (options.skipInstall) {
      console.log(`\nPendiente: cd ${root} && npm install && npm run ui:add -- <componente>`)
      return
    }
    const cwd = path.resolve(root)
    run('npm install --no-audit --no-fund', cwd)
    for (const component of SPARTAN_COMPONENTS) {
      run(`npx nx g @spartan-ng/cli:ui ${component} --no-interactive`, cwd)
    }
    console.log(`\nListo: cd ${root} && make local-setup`)
  }
}

/** Vuelca en package.json y Makefile lo que cada plugin declara en su manifiesto. */
function applyPluginManifests(tree: Tree, root: string, plugins: AppPlugin[]): void {
  if (!plugins.length) {
    return
  }

  const packagePath = path.join(root, 'package.json')
  const pkg = JSON.parse(tree.read(packagePath, 'utf-8') ?? '{}') as {
    scripts?: Record<string, string>
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  for (const plugin of plugins) {
    pkg.scripts = { ...pkg.scripts, ...plugin.scripts }
    pkg.dependencies = sortKeys({ ...pkg.dependencies, ...plugin.dependencies })
    pkg.devDependencies = sortKeys({ ...pkg.devDependencies, ...plugin.devDependencies })
  }
  tree.write(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)

  const targets = plugins.flatMap(p => Object.entries(p.makeTargets ?? {}))
  if (!targets.length) {
    return
  }
  const makefilePath = path.join(root, 'Makefile')
  let makefile = tree.read(makefilePath, 'utf-8') ?? ''
  makefile = makefile.replace(
    /^\.PHONY: (.*)$/m,
    (_match, existing: string) => `.PHONY: ${existing} ${targets.map(([name]) => name).join(' ')}`
  )
  makefile += `\n# --- plugins ---\n${targets.map(([name, body]) => `${name}:\n${body}`).join('\n\n')}\n`
  tree.write(makefilePath, makefile)
}

function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

/** Deja local.json coherente con docker/docker-compose.local.yml. */
function alignLocalDatabase(tree: Tree, configPath: string, appName: string): void {
  const raw = tree.read(configPath, 'utf-8')
  if (!raw) {
    return
  }
  const config = JSON.parse(raw) as { typeorm: Record<string, unknown> }
  config.typeorm = {
    ...config.typeorm,
    port: 5433,
    username: 'app',
    password: 'local_only_not_a_secret',
    database: `${appName}_local`,
    // sin el plugin de migraciones, el esquema local lo materializa TypeORM al arrancar
    synchronize: true
  }
  tree.write(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

function run(command: string, cwd: string): void {
  try {
    execSync(command, { cwd, stdio: 'inherit' })
  } catch {
    console.warn(`\n⚠ Falló "${command}". Reejecútalo a mano en ${cwd}.`)
  }
}

function routeOf(model: { route?: string; context: string; plural: string }): string {
  return (model.route ?? `/${model.context}/${model.plural}`).replace(/^\//, '')
}

/**
 * Copia un árbol de assets sin pasarlo por EJS (el esqueleto es literal) quitando
 * el sufijo `.template`, que solo existe para que el build del plugin no lo compile.
 */
function copyVerbatim(tree: Tree, from: string, to: string): void {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    if (entry.isDirectory()) {
      copyVerbatim(tree, source, path.join(to, entry.name))
      continue
    }
    tree.write(path.join(to, entry.name.replace(/\.template$/, '')), fs.readFileSync(source))
  }
}

/** Mueve un fichero del Tree (devkit no tiene rename: leer, escribir, borrar). */
function move(tree: Tree, from: string, to: string): void {
  const content = tree.read(from)
  if (content) {
    tree.write(to, content)
  }
  tree.delete(from)
}

/** Mueve un subárbol del Tree (devkit no tiene rename: leer, escribir, borrar). */
function relocate(tree: Tree, from: string, to: string): void {
  for (const entry of tree.children(from)) {
    const source = path.join(from, entry)
    const dest = path.join(to, entry)
    if (tree.isFile(source)) {
      const content = tree.read(source)
      if (content) {
        tree.write(dest, content)
      }
      tree.delete(source)
    } else {
      relocate(tree, source, dest)
    }
  }
}

export default appGenerator
