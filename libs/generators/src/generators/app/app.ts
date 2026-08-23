import { formatFiles, generateFiles, names, type GeneratorCallback, type Tree } from '@nx/devkit'
import {
  defineApp,
  defineResource,
  resolveAccess,
  wantsSoftDelete,
  type AppDefinition,
  type ResourceDefinition
} from '@raptor/schema'
import { rolesArgs } from '../resource/build-entrypoints'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { MODELS, registerModels, selectModels } from '../resource/models/registry'
import { emitsSeeder } from '../resource/emits'
import { ignoreNestedWorkspace } from './nxignore'
import { copyVerbatim } from './assets'
import { byDependency } from './dependency-order'
import { applyPorts } from './ports'
import { addFontDependency, themeSubstitutions } from './theme-css'
import { composeApp, composeFlat, type AppComposition, type ComposedDashboardBlock } from './composition'
import { renderClaudeMd } from './brief-doc'
import { emitFlowProcesses } from './flow-process'
import {
  canEmitSharedVo,
  contextSharedGroups,
  sharedConstraintEntries,
  sharedVoSubstitutions,
  sharedVoTestKind
} from './context-shared'
import { SHARED_VOS } from '../resource/models/shared-vos'
import { selectApp } from './apps/registry'
import kernelGenerator from '../kernel/kernel'
import rootGenerator from '../root/root'
import sharedDomainGenerator from '../shared-domain/shared-domain'
import frontendKernelGenerator from '../frontend-kernel/frontend-kernel'
import resourceGenerator from '../resource/resource'
import { migrationsPlugin } from './plugins/migrations.plugin'
import { selectPlugins } from './plugins/registry'
import {
  normalizeLegacyPlugins,
  selectSessionStore,
  selectUi,
  slotPlugins,
  validateCombination,
  type UiLibrary
} from './plugins/slots'
import { PERSISTENCE, selectPersistence } from './persistence/registry'
import type { PersistenceProvider } from './persistence/provider'
import { selectInfra } from './infra/registry'
import { selectDesign } from './design/presets'
import type { DatabaseEngine } from './database'
import type { AppPlugin, PluginContext } from './plugins/plugin'

export interface AppGeneratorSchema {
  name: string
  /** Registered app-schema declaring the composition (mutually exclusive with models/dashboard) */
  app?: string
  /** Path to an app-schema JSON file (e.g. downloaded from the studio wizard); same gate as `app` */
  appFile?: string
  /** Comma-separated model names to include; defaults to the whole registry */
  models?: string
  /** Output directory; defaults to apps/<name> */
  directory?: string
  /** Component library the emitted frontend is built on */
  ui?: UiLibrary
  /** Design preset: shell, density and chrome of the emitted app (default actual) */
  design?: string
  /** Persistence engine of the emitted app (default postgres) */
  database?: DatabaseEngine
  /** Authentication slot of the emitted app (default single-tenant; none retired, spec 58) */
  auth?: string
  /** Session store slot of the emitted app (default postgres; redis requires auth) */
  sessionStore?: string
  /** Infrastructure slot of the emitted app (default none) */
  infra?: string
  /** Comma-separated additive plugins to assemble (email, observability) */
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
  // Nx rellena los defaults del schema.json (dashboard=false), así que solo cuentan
  // como composición explícita un models presente o un dashboard pedido de verdad
  const flatOptions = options.models !== undefined || options.dashboard === true
  const schemaSources = [options.app, options.appFile, flatOptions ? 'flat' : undefined].filter(Boolean)
  if (schemaSources.length > 1) {
    throw new Error(
      `Options 'app', 'appFile' and 'models'/'dashboard' are mutually exclusive: only one composition source is allowed`
    )
  }
  const composition = options.app
    ? composeApp(selectApp(options.app), MODELS)
    : options.appFile
      ? composeApp(loadAppFile(options.appFile), MODELS)
      : composeFlat(selectModels(options.models), options.dashboard ?? false)
  const models = composition.models
  // los sub-generadores siguen recibiendo la lista por nombre, venga de donde venga la composición
  const modelNames = models.map(m => m.name).join(',')
  const ui = selectUi(options.ui)
  // valida antes de emitir: un preset desconocido no puede dejar media app en disco
  const design = selectDesign(options.design)
  const persistence = selectPersistence(options.database)
  // spec 58: toda app lleva auth; none se retiró de la superficie de usuario
  if (options.auth === 'none') {
    throw new Error(
      'auth=none se retiró (spec 58): toda app lleva autenticación single-tenant. ' +
        'Las apps mongo la pierden automáticamente hasta el port a Mongoose.'
    )
  }
  // valida la combinación ranuras×plugins antes de emitir un solo fichero
  const legacy = normalizeLegacyPlugins(options.plugins, {
    database: options.database,
    ui: options.ui,
    auth: options.auth,
    sessionStore: options.sessionStore,
    infra: options.infra
  })
  const selection = legacy.selection
  // ranuras que el motor no puede honrar: fallback declarado por el proveedor, con aviso.
  // Una elección explícita del usuario no se degrada: si contradice al motor, valida y falla.
  for (const [slotName, fallback] of Object.entries(persistence.slotFallbacks ?? {})) {
    if (selection[slotName] === undefined) {
      console.warn(fallback.warning)
      selection[slotName] = fallback.value
    }
  }
  const infra = selectInfra(selection['infra'])
  const sessionStore = selectSessionStore(selection['sessionStore'])
  const chosenPlugins = selectPlugins(legacy.plugins)
  validateCombination(selection, chosenPlugins)
  ensureAttachmentsFitTheEngine(models, persistence)
  ensureCodesFitTheEngine(models, persistence)
  // los proveedores de ranura se aplican antes que los aditivos: email requiere el módulo de auth.
  // Los plugins de fábrica que el motor no admite se quedan fuera (Mongo no migra: sincroniza).
  const excluded = persistence.excludesPlugins ?? []
  const plugins = [migrationsPlugin, ...slotPlugins(selection), ...chosenPlugins].filter(
    plugin => !excluded.includes(plugin.name)
  )

  const backendSrc = path.join(root, 'libs/backend/src')
  const frontendSrc = path.join(root, 'libs/frontend/src')

  // 1. kernel backend + composition root
  await kernelGenerator(tree, {
    directory: backendSrc,
    models: modelNames,
    sharedDomainAlias: SHARED_DOMAIN_ALIAS,
    database: persistence.engine
  })
  await rootGenerator(tree, { directory: backendSrc, models: modelNames, persistenceDir: persistence.persistenceDir })
  // el arranque vive en apps/backend-api; la config por entorno la emite el kernel
  tree.delete(path.join(backendSrc, 'main.ts'))
  tree.delete(path.join(backendSrc, 'environments'))

  // la config debe apuntar a la base que levanta el compose emitido, o `make local-setup`
  // arrancaría contra una que no existe. Qué significa "alinear" lo sabe el motor, no el ensamblador
  const environments = path.join(backendSrc, 'contexts/shared/infrastructure/config/environments')
  persistence.alignEnvironment?.(tree, path.join(environments, 'local.json'), 'local')
  persistence.alignEnvironment?.(tree, path.join(environments, 'test.json'), 'test')

  // 2. DTOs compartidos + kernel Angular
  await sharedDomainGenerator(tree, { directory: path.join(root, 'libs/shared/domain/src'), models: modelNames })
  await frontendKernelGenerator(tree, { directory: frontendSrc, sharedDomainAlias: SHARED_DOMAIN_ALIAS, ui })

  // 3. un módulo por recurso, repartido al layout canónico
  for (const model of models) {
    const staging = path.join(root, '.gen', model.name)
    await resourceGenerator(tree, {
      name: model.name,
      directory: staging,
      sharedDomainAlias: SHARED_DOMAIN_ALIAS,
      database: persistence.engine
    })

    relocate(
      tree,
      path.join(staging, 'backend'),
      path.join(backendSrc, 'contexts', model.context, 'modules', model.plural)
    )
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
      const target = file.includes('.repository.mock.')
        ? path.join(testsRoot, 'mocks')
        : path.join(testsRoot, 'domain/mothers')
      move(tree, path.join(stagedTests, file), path.join(target, file))
    }
    relocate(tree, path.join(staging, 'backend-tests-application'), path.join(testsRoot, 'application/use-cases'))
    relocate(
      tree,
      path.join(staging, 'backend-tests-integration'),
      path.join(root, 'libs/backend/tests/infrastructure/repositories')
    )
    tree.delete(staging)
  }
  tree.delete(path.join(root, '.gen'))

  // 3b. la capa compartida de cada contexto: los VOs que no son de ningún módulo (spec 27).
  //     No la emite el generador de recurso porque `CustomerName` la usan cuatro módulos y el
  //     último en generar ganaría; aquí sí se sabe qué modelos entran.
  for (const group of contextSharedGroups(models)) {
    const sharedDomain = path.join(backendSrc, 'contexts', group.context, 'shared/domain')
    // los tests emitidos son parte del entregable (spec 27, DESIGN §5): van donde el jest de la
    // app los busca, a la profundidad de import del canon
    const sharedTests = path.join(root, 'libs/backend/tests/modules', group.context, 'shared/domain')

    for (const name of group.vos) {
      const vo = SHARED_VOS[name]
      if (!canEmitSharedVo(vo)) {
        continue
      }
      const substitutions = sharedVoSubstitutions(name, vo, group.context)
      generateFiles(
        tree,
        path.join(__dirname, 'files-shared-vo', vo.kind),
        path.join(sharedDomain, 'value-objects'),
        substitutions
      )
      // hay kind que además ponen algo un nivel por encima de los VOs: el período, su error de
      // regla de negocio. El kind que no lo necesite simplemente no trae esa carpeta
      const alongside = path.join(__dirname, 'files-shared-domain', vo.kind)
      if (fs.existsSync(alongside)) {
        generateFiles(tree, alongside, sharedDomain, substitutions)
      }
      // el test del período construye fechas con el VO que declara `of`: sin él no hay test que valga
      if (vo.of && !group.vos.includes(vo.of)) {
        continue
      }
      generateFiles(
        tree,
        path.join(__dirname, 'files-shared-vo-tests', sharedVoTestKind(vo)),
        path.join(sharedTests, 'value-objects'),
        substitutions
      )
    }

    const constraintLines = sharedConstraintEntries(group.vos)
    if (constraintLines.length === 0) {
      continue
    }
    generateFiles(
      tree,
      path.join(__dirname, 'files-context-shared'),
      path.join(backendSrc, 'contexts', group.context, 'shared/domain'),
      {
        constraintLines: constraintLines.map(line => `  ${line}`).join(',\n'),
        tmpl: ''
      }
    )
  }

  // 4. esqueleto: copia literal, sin plantillas. La capa por librería va después
  //    para que pueda sobrescribir lo que dependa de la piel (hoja de estilos).
  // la app es un workspace anidado: el padre no debe escanearla (colisión de proyectos)
  ignoreNestedWorkspace(tree, root)
  copyVerbatim(tree, path.join(__dirname, 'files-skeleton'), root)
  // lo que el motor añade al esqueleto (su compose y el arranque de la integración)
  if (persistence.skeletonFiles) {
    copyVerbatim(tree, path.join(__dirname, persistence.skeletonFiles), root)
  }
  // los tests de los VOs de adjunto viven fuera de src, donde el jest emitido los busca
  if (models.some(model => model.attachments)) {
    copyVerbatim(tree, path.join(__dirname, 'files-attachments-tests'), root)
  }
  // lo que añade el proveedor de infraestructura elegido (adapters de su nube, IaC…)
  if (infra.files) {
    copyVerbatim(tree, path.join(__dirname, infra.files), root)
  }
  copyVerbatim(tree, path.join(__dirname, 'files-skeleton-ui', ui), root)
  // el preset de diseño va DESPUÉS de la piel: su shell gana al del esqueleto (spec 37)
  if (design.files) {
    copyVerbatim(tree, path.join(__dirname, design.files), root)
  }
  // los puertos y el nombre del contenedor se ajustan sobre lo ya copiado (hallazgo 14)
  applyPorts(tree, root, options.name, composition.ports)

  // la nav por rol (spec 46) se parchea sobre el shell ya elegido (esqueleto/piel/preset)
  const shell = shellSubstitutions(composition)
  if (shell.accessAnywhere) {
    applyNavAccess(tree, root, SCOPE)
  }

  // 4a-bis. la memoria del negocio aterriza en la raíz (spec 22): markdown construido aquí
  //          (regla 8), plantilla tonta. Se emite si hay ALGO que recordar: la prosa del
  //          negocio o la frase de alguna entidad — quien describe sus entidades a mano y
  //          nunca pasa por el chat no tiene brief de aplicación, y sus frases se perdían.
  //          Sin nada de eso no hay fichero y las fixtures no cambian.
  if (composition.brief || models.some(model => model.brief)) {
    generateFiles(tree, path.join(__dirname, 'files-brief'), root, {
      claudeMd: renderClaudeMd(options.name, composition.brief, models, composition.flows),
      tmpl: ''
    })
  }

  // 4a-ter. los flujos emiten proceso (spec 39): una clase por flujo, huecos flow-* vacíos.
  //         Coreografía documentada — el grafo NO se ejecuta (regla 7); sin flujos, ni carpeta.
  if (composition.flows?.length) {
    emitFlowProcesses(tree, backendSrc, composition.flows, models)
  }

  // 4b. la hoja de estilos SÍ es plantilla: sus tokens los escribe el tema (spec 20)
  const theme = { ...themeSubstitutions(composition.themeId, composition.themeSeed), designCss: design.css }
  generateFiles(tree, path.join(__dirname, 'files-theme', ui), root, theme)
  // la fuente del tema viaja como dependencia (fase 3): self-hosted, la trae el npm install
  addFontDependency(tree, path.join(root, 'package.json'), theme.fontPackage)

  // 5. lo único que depende de la composición (páginas) y de los modelos
  const testRepositories = models.flatMap(model => persistence.testRepository?.(model) ?? [])
  // el seed siembra por el Register use case: sólo los modelos que lo emiten entran (spec 26)
  // Mismo orden topológico que la migración: sembrar un hijo antes que su padre
  // viola la clave ajena (visto en fincaraiz).
  const seedable = byDependency(models.filter(emitsSeeder))
  generateFiles(tree, path.join(__dirname, 'files'), root, {
    ...shell,
    persistenceDir: persistence.persistenceDir,
    themeClass: theme.themeClass,
    seedImports: seedable
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
    seedModules: seedable.map(model => `${names(model.plural).className}Module`).join(', '),
    // los repositorios concretos los nombra el manifiesto del motor: aquí no se sabe de motores
    repoImports: testRepositories.map(repo => `import { ${repo.className} } from '${repo.importPath}'`).join('\n'),
    repoList: testRepositories.map(repo => `  ${repo.className}`).join(',\n'),
    seedRuns: seedable
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
    generateFiles(
      tree,
      path.join(__dirname, 'files-dashboard'),
      root,
      dashboardSubstitutions(composition.dashboardBlocks)
    )
  }

  // 6. migraciones de fábrica + plugins elegidos en el formulario (auth, email…).
  //    Decisión 2026-07-31: un esquema versionado no es opcional en ningún proyecto.
  const pluginContext: PluginContext = { root, appName, backendSrc, frontendSrc, models, scope: SCOPE, sessionStore }
  for (const plugin of plugins) {
    if (plugin.assets) {
      copyVerbatim(tree, path.join(__dirname, 'plugins', plugin.assets), root)
    }
    plugin.apply?.(tree, pluginContext)
  }
  // el proveedor de infra cablea lo suyo (loader de secretos, telemetría, binding de storage)
  infra.apply?.(tree, pluginContext)
  applyPluginManifests(tree, root, plugins, { ...persistence.dependencies, ...infra.dependencies })

  await formatFiles(tree)

  // 7. tras volcar el árbol: dependencias y componentes Spartan (son un plugin, se
  //    descargan al crear la app en vez de vivir vendorizados en el acelerador)
  return () => {
    if (options.skipInstall) {
      console.log(`\nPendiente: cd ${root} && npm install`)
      return
    }
    const cwd = path.resolve(root)
    // Los helm ya viajan vendorizados con el esqueleto (defecto 13): pedirlos al
    // CLI de Spartan costaba 16 arranques de Nx y agotaba el tope del backend.
    run('npm install --no-audit --no-fund', cwd)
    console.log(`\nListo: cd ${root} && make local-setup`)
  }
}

/**
 * Vuelca en package.json y Makefile lo que declaran los manifiestos: los plugins y el
 * proveedor de persistencia (su driver, que ya no viaja en el esqueleto: tenerlo ahí
 * obligaba a toda app a arrastrar el driver del otro motor).
 */
export function applyPluginManifests(
  tree: Tree,
  root: string,
  plugins: AppPlugin[],
  engineDependencies: Record<string, string> = {}
): void {
  if (!plugins.length && !Object.keys(engineDependencies).length) {
    return
  }

  const packagePath = path.join(root, 'package.json')
  const pkg = JSON.parse(tree.read(packagePath, 'utf-8') ?? '{}') as {
    scripts?: Record<string, string>
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  pkg.dependencies = sortKeys({ ...pkg.dependencies, ...engineDependencies })
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
export function dashboardSubstitutions(blocks: ComposedDashboardBlock[]): Record<string, string> {
  // un total por recurso con métrica, deduplicado y en orden de primera aparición
  const metricModels: ResourceDefinition[] = []
  for (const block of blocks) {
    if (block.kind !== 'metrics') continue
    for (const model of block.models) if (!metricModels.includes(model)) metricModels.push(model)
  }
  const entries = metricModels.map((model, index) => ({
    property: names(model.plural).propertyName,
    api: model.api ?? `/api/v1/${model.plural}`,
    label: model.labels?.plural ?? model.plural,
    subtitle: model.labels?.subtitle,
    total: (index + 1) * 7
  }))
  const analytics = blocks.filter(block => block.kind === 'count-by' || block.kind === 'kpi-count' || block.kind === 'series')
  const tables = blocks.filter(block => block.kind === 'table').map(block => block.models[0])

  const analyticEntries = analytics.map(block => {
    if (block.kind === 'count-by') {
      const values = (block.values ?? []).map(v => `'${v.value}'`).join(', ')
      return `  readonly ${block.property} = this._counts('${block.api}', '${block.field}', [${values}])`
    }
    if (block.kind === 'series') {
      return `  readonly ${block.property} = this._series('${block.api}', '${block.field}')`
    }
    return `  readonly ${block.property} = this._countWhere('${block.api}', '${block.field}', '${block.equals}')
  readonly ${block.property}Total = computed(() => (this.${block.property}.hasValue() ? this.${block.property}.value() : 0))`
  })
  const allProperties = [...entries.map(e => e.property), ...analytics.map(block => block.property ?? '')]

  return {
    resourceEntries: [
      entries
        .map(
          e => `  readonly ${e.property} = this._total('${e.api}')
  readonly ${e.property}Total = computed(() => (this.${e.property}.hasValue() ? this.${e.property}.value().total : 0))`
        )
        .join('\n\n'),
      ...analyticEntries
    ].join('\n\n'),
    analyticHelpers: renderAnalyticServiceHelpers(analytics),
    analyticComponentHelpers: renderAnalyticComponentHelpers(analytics),
    loadingExpr: allProperties.map(p => `this.${p}.isLoading()`).join(' || '),
    errorExpr: allProperties.map(p => `this.${p}.error() !== undefined`).join(' || '),
    // el panel entero, ya montado y en orden (regla 8): la plantilla solo interpola
    panelSections: renderPanelSections(blocks, entries),
    specTotals: entries.map(e => `  '${e.api}': ${e.total}`).join(',\n'),
    specCallAsserts: entries
      .map(e => `    expect(httpGet).toHaveBeenCalledWith('${e.api}', { params: { page: '1', pageSize: '1' } })`)
      .join('\n'),
    specZeroAsserts: entries.map(e => `    expect(service.${e.property}Total()).toBe(0)`).join('\n'),
    ...renderDashboardLists(tables),
    specTotalAsserts: entries.map(e => `    expect(service.${e.property}Total()).toBe(${e.total})`).join('\n'),
    tmpl: ''
  }
}

/** El markup de UN bloque, con la sangría de su sitio. Mismo markup que emitía cada binding. */
function renderBlock(block: ComposedDashboardBlock, metrics: MetricEntry[], pad: string): string {
  if (block.kind === 'metrics') {
    const cols = Math.min(Math.max(block.models.length, 2), 4)
    const cards = block.models
      .map(model => {
        const entry = metrics.find(m => m.property === names(model.plural).propertyName)
        const subtitle = entry?.subtitle ? `\n${pad}    subtitle="${entry.subtitle}"` : ''
        return `${pad}  <app-kpi-card
${pad}    title="${entry?.label ?? model.plural}"
${pad}    [value]="service.${entry?.property}Total()"${subtitle}
${pad}    testId="kpi-${entry?.property}"
${pad}  />`
      })
      .join('\n')
    return `${pad}<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-${cols}">\n${cards}\n${pad}</div>`
  }

  if (block.kind === 'table') {
    return `${pad}<app-${block.models[0].plural}-list [embedded]="true" />`
  }

  return renderAnalyticCard(block, pad)
}

interface MetricEntry {
  property: string
  label: string
  subtitle?: string
}

/**
 * El panel es una secuencia de bloques (spec 53): se recorre EN ORDEN y los `half` consecutivos
 * se envuelven en la rejilla de dos columnas —la misma con la que los analíticos ya se emitían—.
 * Un grupo que queda con un solo `half` se emite a lo ancho: nunca media pantalla vacía.
 */
function renderPanelSections(blocks: ComposedDashboardBlock[], metrics: MetricEntry[]): string {
  const out: string[] = []
  let pending: ComposedDashboardBlock[] = []

  const flush = (): void => {
    if (!pending.length) return
    const cards = pending.map(block => renderBlock(block, metrics, '          '))
    // un solo bloque no justifica la rejilla: sale a lo ancho
    out.push(
      pending.length === 1
        ? renderBlock(pending[0], metrics, '        ')
        : `        <div class="grid gap-4 lg:grid-cols-2">\n${cards.join('\n')}\n        </div>`
    )
    pending = []
  }

  for (const block of blocks) {
    if (block.width === 'half') {
      pending.push(block)
      continue
    }
    flush()
    out.push(renderBlock(block, metrics, '        '))
  }
  flush()

  // una línea en blanco entre bloques; ninguna justo tras `@else {`
  return out.length ? `\n${out.join('\n\n')}` : ''
}

/**
 * Los listados que el panel muestra debajo de los widgets (spec 52). No se emite una tabla
 * nueva: se REUSA el componente de listado del recurso con su cabecera de pantalla apagada,
 * que es justo lo que el lienzo dibuja. Todo el cálculo aquí; la plantilla solo interpola.
 */
function renderDashboardLists(tables: ResourceDefinition[]): Record<string, string> {
  if (!tables.length) return { listImports: '', listSelectors: '' }

  const entries = tables.map(model => ({
    className: `${names(model.name).className}sListComponent`,
    selector: `app-${model.plural}-list`,
    path: `../bounded-contexts/${model.context}/features/${model.plural}/${model.plural}-list.component`
  }))

  return {
    listImports: entries.map(e => `import { ${e.className} } from '${e.path}'`).join('\n'),
    listSelectors: entries.map(e => `, ${e.className}`).join('')
  }
}

/** Helpers del servicio (spec 32): solo los de los kinds presentes, o tsc acusa métodos muertos. */
function renderAnalyticServiceHelpers(analytics: ComposedDashboardBlock[]): string {
  if (!analytics.length) return ''
  const kinds = new Set(analytics.map(w => w.kind))
  const blocks: string[] = []

  if (kinds.has('count-by')) {
    blocks.push(`  /** N conteos, uno por valor del enum: el listado ya sabe contar filtrado. */
  private _counts(api: string, field: string, values: string[]) {
    return resource<number[], unknown>({
      loader: () =>
        Promise.all(
          values.map(value =>
            firstValueFrom(this._http.get<PaginatedTotal>(api, { params: this._countParams(field, 'eq', value) })).then(
              r => r.total
            )
          )
        )
    })
  }`)
  }
  if (kinds.has('kpi-count')) {
    blocks.push(`  /** Un conteo condicionado: cuántos cumplen field = value. */
  private _countWhere(api: string, field: string, value: string) {
    return resource<number, unknown>({
      loader: () =>
        firstValueFrom(this._http.get<PaginatedTotal>(api, { params: this._countParams(field, 'eq', value) })).then(
          r => r.total
        )
    })
  }`)
  }
  if (kinds.has('series')) {
    blocks.push(`  /** Altas por mes, últimos 12 meses: dos filtros de rango por punto. */
  private _series(api: string, field: string) {
    const now = new Date()
    const months = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      return { label: start.toLocaleDateString('es-ES', { month: 'short' }), start, end }
    })
    return resource<{ label: string; count: number }[], unknown>({
      loader: () =>
        Promise.all(
          months.map(month =>
            firstValueFrom(
              this._http.get<PaginatedTotal>(api, {
                params: {
                  page: '1',
                  pageSize: '1',
                  filters: JSON.stringify([
                    { field, operator: 'gte', value: this._day(month.start) },
                    { field, operator: 'lt', value: this._day(month.end) }
                  ])
                }
              })
            ).then(r => ({ label: month.label, count: r.total }))
          )
        )
    })
  }

  private _day(date: Date): string {
    return date.toISOString().slice(0, 10)
  }`)
  }
  blocks.push(`  private _countParams(field: string, operator: string, value: string) {
    return { page: '1', pageSize: '1', filters: JSON.stringify([{ field, operator, value }]) }
  }`)

  return `\n\n${blocks.join('\n\n')}`
}

/** Secciones del dashboard (spec 32): barras horizontales, KPI condicionado y mini serie. */
function renderAnalyticCard(block: ComposedDashboardBlock, pad: string): string {
  if (block.kind === 'kpi-count') {
    return `${pad}<app-kpi-card title="${block.label}" [value]="service.${block.property}Total()" testId="kpi-count-${block.property}" />`
  }
  if (block.kind === 'count-by') {
    const labels = (block.values ?? []).map(v => `'${v.label}'`).join(', ')
    return `${pad}<div class="bg-card rounded-lg border p-4" data-testid="count-by-${block.property}">
${pad}  <h2 class="mb-3 text-sm font-semibold">${block.label}</h2>
${pad}  @if (service.${block.property}.hasValue()) {
${pad}    <div class="space-y-2">
${pad}      @for (bar of bars(service.${block.property}.value(), [${labels}]); track bar.label) {
${pad}        <div class="flex items-center gap-2 text-sm">
${pad}          <span class="text-muted-foreground w-28 shrink-0 truncate">{{ bar.label }}</span>
${pad}          <div class="bg-muted h-3 flex-1 overflow-hidden rounded-sm">
${pad}            <div class="bg-primary h-full rounded-sm" [style.width.%]="bar.width"></div>
${pad}          </div>
${pad}          <span class="w-8 text-right tabular-nums">{{ bar.count }}</span>
${pad}        </div>
${pad}      }
${pad}    </div>
${pad}  }
${pad}</div>`
  }
  return `${pad}<div class="bg-card rounded-lg border p-4" data-testid="series-${block.property}">
${pad}  <h2 class="mb-3 text-sm font-semibold">${block.label}</h2>
${pad}  @if (service.${block.property}.hasValue()) {
${pad}    <div class="flex items-end gap-1">
${pad}      @for (point of points(service.${block.property}.value()); track point.label) {
${pad}        <div class="flex flex-1 flex-col items-center gap-1">
${pad}          <!-- carril de altura fija: un % necesita un padre con altura definida -->
${pad}          <div class="flex h-24 w-full items-end">
${pad}            <div class="bg-primary w-full rounded-t-sm" [style.height.%]="point.height" [title]="point.count"></div>
${pad}          </div>
${pad}          <span class="text-muted-foreground text-[10px]">{{ point.label }}</span>
${pad}        </div>
${pad}      }
${pad}    </div>
${pad}  }
${pad}</div>`
}

/** Escalado de barras en el componente: solo si hay widgets que lo usen. */
function renderAnalyticComponentHelpers(analytics: ComposedDashboardBlock[]): string {
  const kinds = new Set(analytics.map(w => w.kind))
  const blocks: string[] = []
  if (kinds.has('count-by')) {
    blocks.push(`  bars(counts: number[], labels: string[]): { label: string; count: number; width: number }[] {
    const max = Math.max(...counts, 1)
    return counts.map((count, index) => ({ label: labels[index], count, width: (count / max) * 100 }))
  }`)
  }
  if (kinds.has('series')) {
    blocks.push(`  points(values: { label: string; count: number }[]): { label: string; count: number; height: number }[] {
    const max = Math.max(...values.map(v => v.count), 1)
    return values.map(v => ({ ...v, height: (v.count / max) * 100 }))
  }`)
  }
  return blocks.length ? `\n\n${blocks.join('\n\n')}` : ''
}

/**
 * Carga un app-schema desde un JSON del usuario (p. ej. descargado del wizard
 * del estudio) y le aplica el mismo gate estructural que a los registrados.
 */
function loadAppFile(file: string): AppDefinition {
  if (!fs.existsSync(file)) {
    throw new Error(`App-schema file no existe: ${file}`)
  }
  const { resources, ...definition } = JSON.parse(fs.readFileSync(file, 'utf-8')) as AppDefinition & {
    resources?: ResourceDefinition[]
  }
  // entidades diseñadas en el estudio: pasan el MISMO gate que las registradas
  // y entran al registro de esta generación antes de componer
  if (resources?.length) {
    registerModels(resources.map(r => defineResource(r)))
  }
  return defineApp(definition)
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
  accessAnywhere: boolean
} {
  const modelOf = (resource: string): ResourceDefinition => {
    const model = composition.models.find(m => m.name === resource)
    if (!model) throw new Error(`Composition page references resource '${resource}' outside its own models`)
    return model
  }
  const galleryPath = (model: ResourceDefinition): string => `${routeOf(model)}/galeria`
  const ganttPath = (model: ResourceDefinition): string => `${routeOf(model)}/cronograma`
  const formPath = (model: ResourceDefinition): string => `${routeOf(model)}/formulario`
  // Una vista de tarjetas apunta a la galería; una de cronograma, al gantt; una de tabla, al listado.
  const pathOf = (page: AppComposition['pages'][number]): string => {
    if (page.kind === 'dashboard') return 'dashboard'
    const model = modelOf(page.resource)
    if (page.kind === 'cards') return galleryPath(model)
    if (page.kind === 'gantt') return ganttPath(model)
    if (page.kind === 'form') return formPath(model)
    return routeOf(model)
  }

  const dashboardRoute = `  {
    path: 'dashboard',
    loadComponent: () =>
      import('${SCOPE}/frontend/domains/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  }`

  const featureOf = (model: ResourceDefinition): string =>
    `${SCOPE}/frontend/domains/admin/bounded-contexts/${model.context}/features/${model.plural}`

  const listRoute = (model: ResourceDefinition): string => `  {
    path: '${routeOf(model)}',
    loadComponent: () =>
      import(
        '${featureOf(model)}/${model.plural}-list.component'
      ).then(m => m.${names(model.name).className}sListComponent)
  }`

  const galleryRoute = (model: ResourceDefinition): string => `  {
    path: '${galleryPath(model)}',
    loadComponent: () =>
      import(
        '${featureOf(model)}/${model.plural}-gallery.component'
      ).then(m => m.${names(model.plural).className}GalleryComponent)
  }`

  const ganttRoute = (model: ResourceDefinition): string => `  {
    path: '${ganttPath(model)}',
    loadComponent: () =>
      import(
        '${featureOf(model)}/${model.plural}-gantt.component'
      ).then(m => m.${names(model.plural).className}GanttComponent)
  }`

  const trashRoute = (model: ResourceDefinition): string => `  {
    path: '${routeOf(model)}/papelera',
    loadComponent: () =>
      import(
        '${featureOf(model)}/${model.plural}-trash.component'
      ).then(m => m.${names(model.plural).className}TrashComponent)
  }`

  // alta y edición comparten componente: la página decide el modo por la presencia de :id (spec 48)
  const formRoute = (model: ResourceDefinition): string => `  {
    path: '${formPath(model)}',
    loadComponent: () =>
      import(
        '${featureOf(model)}/${names(model.name).fileName}-form-page.component'
      ).then(m => m.${names(model.name).className}FormPageComponent)
  },
  {
    path: '${formPath(model)}/:id',
    loadComponent: () =>
      import(
        '${featureOf(model)}/${names(model.name).fileName}-form-page.component'
      ).then(m => m.${names(model.name).className}FormPageComponent)
  }`

  const detailRoute = (model: ResourceDefinition): string => `  {
    path: '${routeOf(model)}/:id',
    loadComponent: () =>
      import(
        '${featureOf(model)}/${names(model.name).fileName}-detail.component'
      ).then(m => m.${names(model.name).className}DetailComponent)
  }`

  /**
   * Las rutas se agrupan por modelo aunque el mismo recurso aparezca en varias
   * vistas: la ficha es una sola, se declare desde donde se declare. Y el orden
   * es obligatorio — listado, galería y ':id' al final, porque declarado antes
   * capturaría 'galeria' como si fuera un identificador.
   */
  const seen = new Set<string>()
  const routes: string[] = []
  for (const page of composition.pages) {
    if (page.kind === 'dashboard') {
      routes.push(dashboardRoute)
      continue
    }
    const model = modelOf(page.resource)
    if (seen.has(model.name)) continue
    seen.add(model.name)

    const wantsList = composition.pages.some(p => p.kind === 'resource' && p.resource === model.name)
    const wantsGallery = Boolean(model.gallery)
    const wantsGantt = Boolean(model.gantt)
    const wantsForm = Boolean(model.form)
    // la papelera (spec 29) se deriva de softDelete + listado que borra; sin entrada de menú
    const wantsTrash = wantsSoftDelete(model) && model.list?.features?.delete === true
    if (wantsList) routes.push(listRoute(model))
    if (wantsGallery) routes.push(galleryRoute(model))
    if (wantsGantt) routes.push(ganttRoute(model))
    if (wantsForm) routes.push(formRoute(model))
    if (wantsTrash) routes.push(trashRoute(model))
    if (model.detail) routes.push(detailRoute(model))
  }

  // la entrada de nav gana sus roles de Ver SOLO si el modelo declara matriz (spec 46):
  // sin matriz en ningún modelo lo emitido no cambia y el golden no se mueve
  const navRolesOf = (page: AppComposition['pages'][number]): string => {
    if (page.kind === 'dashboard') return ''
    const model = modelOf(page.resource)
    if (!model.access) return ''
    return `, roles: [${rolesArgs(resolveAccess(model).view)}]`
  }

  return {
    defaultRoute: pathOf(composition.pages[0]),
    routeEntries: routes.join(',\n'),
    // Una entrada por VISTA: si el mismo recurso tiene tabla y galería, son dos
    // vistas y por tanto dos entradas, cada una con su propio título.
    navItems: composition.pages
      .map(page => `  { label: '${page.label}', route: '/${pathOf(page)}'${navRolesOf(page)} }`)
      .join(',\n'),
    accessAnywhere: composition.models.some(model => model.access !== undefined)
  }
}

/**
 * El shell oculta la entrada de nav sin Ver (spec 46): se parchea sobre lo ya copiado
 * (los 4 shells comparten las tres costuras), mismo patrón que el plugin de auth.
 * Solo se aplica cuando algún modelo declara matriz: sin ella el shell queda intacto.
 */
export function applyNavAccess(tree: Tree, root: string, scope: string): void {
  const shellPath = path.join(root, 'apps/frontend-app/src/app.component.ts')
  const source = tree.read(shellPath, 'utf-8')
  if (!source || source.includes('AuthService')) return

  const filtered = [
    'private readonly _navAuth = inject(AuthService)',
    '',
    '  // la entrada sin Ver se oculta (spec 46): evita el enlace que acaba en un 403',
    '  protected readonly navItems = computed(() => {',
    '    const role = this._navAuth.currentUser()?.role',
    '    return NAV_ITEMS.filter(item => !item.roles || (role !== undefined && item.roles.includes(role)))',
    '  })'
  ].join('\n')

  const patched = source
    .replace(
      "import { NAV_ITEMS } from './nav'",
      `import { NAV_ITEMS } from './nav'\nimport { AuthService } from '${scope}/frontend/core/services/auth.service'`
    )
    .replace('@for (item of navItems; track item.route) {', '@for (item of navItems(); track item.route) {')
    .replace('protected readonly navItems = NAV_ITEMS', filtered)
  tree.write(shellPath, patched)
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

/**
 * Los adjuntos emiten hoy una entidad TypeORM, así que solo el motor que declara soportarlos puede
 * emitirlos. Se comprueba aquí y no como `requires` de una ranura porque el disparador es una
 * propiedad del MODELO, no de la selección del usuario; qué motor los soporta lo dice su manifiesto.
 */
/**
 * El código de negocio se apoya en una SECUENCIA del motor (spec 19). Mongo no tiene, y el
 * sustituto (un contador en una colección con findOneAndUpdate) es otro mecanismo con otras
 * garantías: se rechaza en vez de inventarlo, igual que con los adjuntos.
 */
function ensureCodesFitTheEngine(models: ResourceDefinition[], persistence: PersistenceProvider): void {
  if (persistence.codeFiles) {
    return
  }
  const offender = models.find(model => model.code)
  if (!offender) {
    return
  }
  const supported = Object.values(PERSISTENCE)
    .filter(candidate => candidate.codeFiles)
    .map(candidate => candidate.engine)

  throw new Error(
    `Business code on '${offender.name}' needs a persistence engine with sequences (${supported.join(', ')}) ` +
      `and the app targets ${persistence.engine}. Drop code from the model or use --database=${supported[0]}.`
  )
}

function ensureAttachmentsFitTheEngine(models: ResourceDefinition[], persistence: PersistenceProvider): void {
  if (persistence.supportsAttachments) {
    return
  }
  const offender = models.find(model => model.attachments)
  if (!offender) {
    return
  }
  // los motores que sí los soportan salen del registro: el ensamblador no los nombra a mano y el
  // mensaje sigue siendo correcto el día que otro motor los emita
  const supported = Object.values(PERSISTENCE)
    .filter(candidate => candidate.supportsAttachments)
    .map(candidate => candidate.engine)

  throw new Error(
    `Attachments on '${offender.name}' need a persistence engine that emits them (${supported.join(', ')}) ` +
      `and the app targets ${persistence.engine}. Drop attachments from the model or use --database=${supported[0]}.`
  )
}
