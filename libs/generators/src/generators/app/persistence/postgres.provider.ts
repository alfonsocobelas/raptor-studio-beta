import { names, type Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@acc/schema'
import { definePersistence } from './provider'

/**
 * Los nombres de BD son fijos (app_local/app_test) porque el compose del esqueleto se
 * copia verbatim: no se templa. Los puertos esquivan un Postgres de sistema en 5432.
 */
const ENVIRONMENTS = {
  local: { port: 5433, password: 'local_only_not_a_secret', database: 'app_local', synchronize: true },
  test: { port: 5434, password: 'test_only_not_a_secret', database: 'app_test', synchronize: false }
} as const

export const postgresPersistence = definePersistence({
  engine: 'postgres',
  kernelFiles: 'files-postgres',

  alignEnvironment(tree: Tree, configPath: string, environment: 'local' | 'test'): void {
    const raw = tree.read(configPath, 'utf-8')
    if (!raw) {
      return
    }
    const config = JSON.parse(raw) as { typeorm: Record<string, unknown> }
    config.typeorm = { ...config.typeorm, username: 'app', ...ENVIRONMENTS[environment] }
    tree.write(configPath, `${JSON.stringify(config, null, 2)}\n`)
  },

  testRepository(model: ResourceDefinition): { className: string; importPath: string } {
    const n = names(model.name)
    return {
      className: `TypeOrm${n.className}Repository`,
      importPath: `../../src/contexts/${model.context}/modules/${model.plural}/infrastructure/persistence/typeorm/typeorm-${n.fileName}.repository`
    }
  }
})
