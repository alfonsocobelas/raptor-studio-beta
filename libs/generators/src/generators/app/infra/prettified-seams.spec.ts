import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import type { PluginContext } from '../plugins/plugin'

/**
 * Defecto 43 del ROADMAP (2026-08-31, cazado verificando la spec 78): al generar FUERA del
 * repo, el formatFiles del kernel resuelve el prettier por DEFECTO (comillas dobles +
 * semicolons) y los replaces literales de las costuras de infra fallan en silencio — el
 * provider entra en el array pero su import no, y el emitido no compila
 * (`raptorLogTransportsProvider is not defined`). Este spec reproduce ese estado
 * prettificado antes de aplicar cada proveedor.
 */
describe('las costuras de infra sobreviven al fichero prettificado (defecto 43)', () => {
  // Simula el prettier por defecto sobre un fuente emitido: comillas dobles y
  // semicolon al final de imports y de miembros de interfaz/clase.
  const prettify = (source: string): string =>
    source
      .split('\n')
      .map(line => {
        let out = line.replace(/'([^']*)'/g, '"$1"')
        if (/^import .*"$/.test(out) || /^\s+\w+[?!]?: [\w<>| ."]+$/.test(out.trimEnd())) {
          out = `${out};`
        }
        return out
      })
      .join('\n')

  const SEAM_FILES = [
    'libs/backend/src/contexts/shared/infrastructure/logger/logger.module.ts',
    'libs/backend/src/contexts/shared/infrastructure/config/config.module.ts',
    'libs/backend/src/contexts/shared/infrastructure/config/config-types.ts',
    'libs/backend/src/contexts/shared/infrastructure/config/config-validation.ts'
  ]

  const buildPrettifiedTree = async (): Promise<{ tree: Tree; context: PluginContext }> => {
    const tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'none' })
    for (const file of SEAM_FILES) {
      const p = `apps/demo/${file}`
      const source = tree.read(p, 'utf-8')
      if (source) tree.write(p, prettify(source))
    }
    const context: PluginContext = {
      root: 'apps/demo',
      appName: 'demo',
      backendSrc: 'apps/demo/libs/backend/src',
      frontendSrc: 'apps/demo/libs/frontend/src',
      models: [],
      scope: '@sap-licenses',
      sessionStore: 'postgres',
      infra: 'none',
      roles: []
    }
    return { tree, context }
  }

  const read = (tree: Tree, file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''
  const LOGGER = 'libs/backend/src/contexts/shared/infrastructure/logger/logger.module.ts'
  const CONFIG = 'libs/backend/src/contexts/shared/infrastructure/config/config.module.ts'
  const TYPES = 'libs/backend/src/contexts/shared/infrastructure/config/config-types.ts'

  it.each([
    ['azure', 'azureLogTransportsProvider', './azure-log-transports'],
    ['aws', 'awsLogTransportsProvider', './aws-log-transports'],
    ['raptor', 'raptorLogTransportsProvider', './raptor-log-transports'],
    ['gcp', 'gcpLogTransportsProvider', './gcp-log-transports']
  ])('infra=%s enchufa el transporte del logger CON su import sobre el fichero prettificado', async (infra, provider, importPath) => {
    const { tree, context } = await buildPrettifiedTree()

    INFRA[infra].apply?.(tree, { ...context, infra })
    const logger = read(tree, LOGGER)

    // invariante de compilación: si el provider está en el array, su import existe
    expect(logger).toContain(provider)
    expect(logger).toContain(importPath)
  })

  it.each([
    ['azure', 'azure/azure-config-loader'],
    ['aws', 'aws/aws-config-loader'],
    ['raptor', 'infisical/infisical-config-loader'],
    ['gcp', 'gcp/gcp-config-loader']
  ])('infra=%s cambia el loader de config sobre el fichero prettificado', async (infra, loader) => {
    const { tree, context } = await buildPrettifiedTree()

    INFRA[infra].apply?.(tree, { ...context, infra })
    const config = read(tree, CONFIG)

    expect(config).toContain(loader)
    expect(config).not.toMatch(/from ['"]\.\/loaders\/config-loader['"]/)
  })

  it('infra=aws reforma la sección storage aunque la interfaz venga con semicolons', async () => {
    const { tree, context } = await buildPrettifiedTree()

    INFRA['aws'].apply?.(tree, { ...context, infra: 'aws' })
    const types = read(tree, TYPES)

    expect(types).toContain('bucket: string')
    expect(types).not.toContain('connectionString: string')
  })
})
