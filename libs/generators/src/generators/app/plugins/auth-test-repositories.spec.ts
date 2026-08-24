import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { authPlugin } from './auth.plugin'
import type { PluginContext } from './plugin'

const TEST_REPOSITORIES = `import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TypeOrmGarmentRepository } from '../../src/contexts/warehouse/modules/garments/infrastructure/persistence/typeorm/typeorm-garment.repository'

const repositories = [
  TypeOrmGarmentRepository
]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
`

const context: PluginContext = {
  root: 'apps/demo',
  appName: 'demo',
  backendSrc: 'apps/demo/libs/backend/src',
  frontendSrc: 'apps/demo/libs/frontend/src',
  models: [],
  scope: '@app',
  sessionStore: 'postgres',
  infra: 'none'
}

const MODULE_PATH = 'apps/demo/libs/backend/tests/infrastructure/test-repositories.module.ts'

describe('authPlugin — repos IAM en TestRepositoriesModule', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write(MODULE_PATH, TEST_REPOSITORIES)
  })

  it('registra TypeOrmUserRepository para los tests de integración de IAM', () => {
    authPlugin.apply?.(tree, context)

    const source = tree.read(MODULE_PATH, 'utf-8') ?? ''
    expect(source).toContain(
      "import { TypeOrmUserRepository } from '../../src/contexts/iam/modules/auth/infrastructure/persistence/typeorm/typeorm-user.repository'"
    )
    expect(source).toMatch(/const repositories = \[[\s\S]*TypeOrmUserRepository\n\]/)
  })

  it('es idempotente: aplicar dos veces no duplica el repo', () => {
    authPlugin.apply?.(tree, context)
    authPlugin.apply?.(tree, context)

    const source = tree.read(MODULE_PATH, 'utf-8') ?? ''
    expect(source.match(/TypeOrmUserRepository/g)?.length).toBe(2) // import + lista
  })
})
