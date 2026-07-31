import { formatFiles, generateFiles, names, type GeneratorCallback, type Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@acc/schema'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { MODELS, selectModels } from '../resource/models/registry'
import { composeApp, composeFlat, type AppComposition } from './composition'
import { selectApp } from './apps/registry'
import kernelGenerator from '../kernel/kernel'
import rootGenerator from '../root/root'
import sharedDomainGenerator from '../shared-domain/shared-domain'
import frontendKernelGenerator from '../frontend-kernel/frontend-kernel'
import resourceGenerator from '../resource/resource'
import { migrationsPlugin } from './plugins/migrations.plugin'
import { selectPlugins } from './plugins/registry'
import { selectDatabase, type DatabaseEngine } from './database'
import type { AppPlugin, PluginContext } from './plugins/plugin'

export interface AppGeneratorSchema {
  name: string
  /** Registered app-schema declaring the composition (mutually exclusive with models/dashboard) */
  app?: string
  /** Comma-separated model names to include; defaults to the whole registry */
  models?: string
  /** Output directory; defaults to apps/<name> */
  directory?: string
  /** Component library the emitted frontend is built on */
  ui?: 'spartan' | 'material'
  /** Persistence engine of the emitted app (default postgres) */
  database?: DatabaseEngine
  /** Comma-separated plugins to assemble (migrations, auth) */
  plugins?: string
  /** Emit a KPI dashboard (one total per resource) as the home screen */
  dashboard?: boolean
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
  if (options.app && (options.models !== undefined || options.dashboard !== undefined)) {
    throw new Error(
      `Options 'app' and 'models'/'dashboard' are mutually exclusive: the app-schema '${options.app}' already declares the composition`
    )
  }
  const composition = options.app
    ? composeApp(selectApp(options.app), MODELS)
    : composeFlat(selectModels(options.models), options.dashboard ?? false)
  const models = composition.models
  // los sub-generadores siguen recibiendo la lista por nombre, venga de donde venga la composición
  const modelNames = models.map(m => m.name).join(',')
  const ui = options.ui ?? 'spartan'
  const database = selectDatabase(options.database)
  // valida la combinación plugins×motor antes de emitir un solo fichero
  const plugins = [migrationsPlugin, ...selectPlugins(options.plugins, database)]

  const backendSrc = path.join(root, 'libs/backend/src')
  const frontendSrc = path.join(root, 'libs/frontend/src')

  // 1. kernel backend + composition root
  await kernelGenerator(tree, {
    directory: backendSrc,
    models: modelNames,
    sharedDomainAlias: SHARED_DOMAIN_ALIAS,
    database
  })
  await rootGenerator(tree, { directory: backendSrc, models: modelNames })
  // el arranque vive en apps/backend-api; la config por entorno la emite el kernel
  tree.delete(path.join(backendSrc, 'main.ts'))
  tree.delete(path.join(backendSrc, 'environments'))

  // la config local debe apuntar al Postgres que levanta el compose emitido,
  // o `make local-setup` arrancaría contra una base que no existe
  alignDatabase(tree, path.join(backendSrc, 'contexts/shared/infrastructure/config/environments/local.json'), {
    port: 5433,
    password: 'local_only_not_a_secret',
    database: 'app_local',
    synchronize: true
  })
  // la suite de integración corre contra el Postgres efímero del compose de test
  alignDatabase(tree, path.join(backendSrc, 'contexts/shared/infrastructure/config/environments/test.json'), {
    port: 5434,
    password: 'test_only_not_a_secret',
    database: 'app_test',
    synchronize: false
  })

  // 2. DTOs compartidos + kernel Angular
  await sharedDomainGenerator(tree, { directory: path.join(root, 'libs/shared/domain/src'), models: modelNames })
  await frontendKernelGenerator(tree, { directory: frontendSrc, sharedDomainAlias: SHARED_DOMAIN_ALIAS, ui })

  // 3. un módulo por recurso, repartido al layout canónico
  for (const model of models) {
    const staging = path.join(root, '.gen', model.name)
    await resourceGenerator(tree, { name: model.name, directory: staging, sharedDomainAlias: SHARED_DOMAIN_ALIAS, database })

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
    // Layout canónico de tests: el mock del repositorio vive en mocks/ (4 niveles hasta
    // la raíz del backend), mother/builder en domain/mothers/ y los property-tests de VOs
    // en domain/value-objects/ (5 niveles) — las profundidades de import lo exigen.
    const stagedTests = path.join(staging, 'backend-tests')
    const testsRoot = path.join(root, 'libs/backend/tests/modules', model.plural)
    relocate(tree, path.join(stagedTests, 'value-objects'), path.join(testsRoot, 'domain/value-objects'))
    for (const file of tree.children(stagedTests)) {
      if (!tree.isFile(path.join(stagedTests, file))) {
        continue
      }
      const target = file.includes('.repository.mock.') ? path.join(testsRoot, 'mocks') : path.join(testsRoot, 'domain/mothers')
      move(tree, path.join(stagedTests, file), path.join(target, file))
    }
    relocate(
      tree,
      path.join(staging, 'backend-tests-application'),
      path.join(testsRoot, 'application/use-cases')
    )
    relocate(
      tree,
      path.join(staging, 'backend-tests-integration'),
      path.join(root, 'libs/backend/tests/infrastructure/repositories')
    )
    tree.delete(staging)
  }
  tree.delete(path.join(root, '.gen'))

  // 4. esqueleto: copia literal, sin plantillas. La capa por librería va después
  //    para que pueda sobrescribir lo que dependa de la piel (hoja de estilos).
  copyVerbatim(tree, path.join(__dirname, 'files-skeleton'), root)
  copyVerbatim(tree, path.join(__dirname, 'files-skeleton-ui', ui), root)

  // 5. lo único que depende de la composición (páginas) y de los modelos
  generateFiles(tree, path.join(__dirname, 'files'), root, {
    ...shellSubstitutions(composition),
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
    repoImports: models
      .map(model => {
        const n = names(model.name)
        return `import { TypeOrm${n.className}Repository } from '../../src/contexts/${model.context}/modules/${model.plural}/infrastructure/persistence/typeorm/typeorm-${n.fileName}.repository'`
      })
      .join('\n'),
    repoList: models.map(model => `  TypeOrm${names(model.name).className}Repository`).join(',\n'),
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
  if (composition.dashboard) {
    generateFiles(tree, path.join(__dirname, 'files-dashboard'), root, dashboardSubstitutions(composition.kpiModels))
  }

  // 6. migraciones de fábrica + plugins elegidos en el formulario (auth, email…).
  //    Decisión 2026-07-31: un esquema versionado no es opcional en ningún proyecto.
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
    // los helm solo existen como fuente materializada; Material son paquetes npm normales
    if (ui === 'spartan') {
      for (const component of SPARTAN_COMPONENTS) {
        run(`npx nx g @spartan-ng/cli:ui ${component} --no-interactive`, cwd)
      }
    }
    console.log(`\nListo: cd ${root} && make local-setup`)
  }
}

/** Vuelca en package.json y Makefile lo que cada plugin declara en su manifiesto. */
export function applyPluginManifests(tree: Tree, root: string, plugins: AppPlugin[]): void {
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

  const setupSteps = plugins.flatMap(p => p.localSetupSteps ?? [])
  if (setupSteps.length) {
    makefile = makefile.replace(
      /^(local-setup:(?:.*\n)*?)(\t@echo )/m,
      `$1${setupSteps.map(step => `\t$(MAKE) ${step}\n`).join('')}$2`
    )
  }
  tree.write(makefilePath, makefile)
}

function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

/**
 * Deja cada environment coherente con su docker-compose. Los nombres de BD son fijos
 * (app_local/app_test) porque el esqueleto se copia verbatim: el compose no se templa.
 */
function alignDatabase(
  tree: Tree,
  configPath: string,
  overrides: { port: number; password: string; database: string; synchronize: boolean }
): void {
  const raw = tree.read(configPath, 'utf-8')
  if (!raw) {
    return
  }
  const config = JSON.parse(raw) as { typeorm: Record<string, unknown> }
  config.typeorm = { ...config.typeorm, username: 'app', ...overrides }
  tree.write(configPath, `${JSON.stringify(config, null, 2)}
`)
}

function run(command: string, cwd: string): void {
  try {
    execSync(command, { cwd, stdio: 'inherit' })
  } catch {
    console.warn(`\n⚠ Falló "${command}". Reejecútalo a mano en ${cwd}.`)
  }
}

/**
 * Bindings del dashboard opcional, pre-masticados (plantillas tontas): una carga de
 * total por recurso y su KPI card. Los totales del spec son distintos por recurso
 * (deterministas, derivados del orden) para que un cruce de endpoints falle.
 */
export function dashboardSubstitutions(models: ResourceDefinition[]): Record<string, string> {
  const entries = models.map((model, index) => ({
    property: names(model.plural).propertyName,
    api: model.api ?? `/api/v1/${model.plural}`,
    label: model.labels?.plural ?? model.plural,
    subtitle: model.labels?.subtitle,
    total: (index + 1) * 7
  }))
  return {
    resourceEntries: entries
      .map(
        e => `  readonly ${e.property} = this._total('${e.api}')
  readonly ${e.property}Total = computed(() => (this.${e.property}.hasValue() ? this.${e.property}.value().total : 0))`
      )
      .join('\n\n'),
    loadingExpr: entries.map(e => `this.${e.property}.isLoading()`).join(' || '),
    errorExpr: entries.map(e => `this.${e.property}.error() !== undefined`).join(' || '),
    gridCols: String(Math.min(Math.max(entries.length, 2), 4)),
    kpiCards: entries
      .map(e => {
        const subtitle = e.subtitle ? `\n            subtitle="${e.subtitle}"` : ''
        return `          <app-kpi-card
            title="${e.label}"
            [value]="service.${e.property}Total()"${subtitle}
            testId="kpi-${e.property}"
          />`
      })
      .join('\n'),
    specTotals: entries.map(e => `  '${e.api}': ${e.total}`).join(',\n'),
    specCallAsserts: entries
      .map(e => `    expect(httpGet).toHaveBeenCalledWith('${e.api}', { params: { page: '1', pageSize: '1' } })`)
      .join('\n'),
    specZeroAsserts: entries.map(e => `    expect(service.${e.property}Total()).toBe(0)`).join('\n'),
    specTotalAsserts: entries.map(e => `    expect(service.${e.property}Total()).toBe(${e.total})`).join('\n'),
    tmpl: ''
  }
}

function routeOf(model: { route?: string; context: string; plural: string }): string {
  return (model.route ?? `/${model.context}/${model.plural}`).replace(/^\//, '')
}

/**
 * Bindings del shell (rutas, menú y ruta por defecto), pre-masticados desde la
 * composición: el orden de páginas gobierna el orden de nav y rutas, y la primera
 * página es la ruta por defecto. Plantillas tontas: aquí se decide todo.
 */
export function shellSubstitutions(composition: AppComposition): {
  defaultRoute: string
  routeEntries: string
  navItems: string
} {
  const modelOf = (resource: string): ResourceDefinition => {
    const model = composition.models.find(m => m.name === resource)
    if (!model) throw new Error(`Composition page references resource '${resource}' outside its own models`)
    return model
  }
  const pathOf = (page: AppComposition['pages'][number]): string =>
    page.kind === 'dashboard' ? 'dashboard' : routeOf(modelOf(page.resource))
  const dashboardRoute = `  {
    path: 'dashboard',
    loadComponent: () =>
      import('${SCOPE}/frontend/domains/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  }`

  return {
    defaultRoute: pathOf(composition.pages[0]),
    routeEntries: composition.pages
      .map(page => {
        if (page.kind === 'dashboard') return dashboardRoute
        const model = modelOf(page.resource)
        return `  {
    path: '${routeOf(model)}',
    loadComponent: () =>
      import(
        '${SCOPE}/frontend/domains/admin/bounded-contexts/${model.context}/features/${model.plural}/${model.plural}-list.component'
      ).then(m => m.${names(model.name).className}sListComponent)
  }`
      })
      .join(',\n'),
    navItems: composition.pages.map(page => `  { label: '${page.label}', route: '/${pathOf(page)}' }`).join(',\n')
  }
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
