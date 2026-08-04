import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { readFileSync } from 'fs'
import * as path from 'path'
import { appGenerator } from './app'

/**
 * TASK-08 (spec 23): el ensamblador deja de nombrar motores. Los dos restos de TypeORM
 * que vivían en app.ts — el wiring del módulo de test-repositories y el parche de la
 * config local/test — pasan al manifiesto del proveedor.
 */
describe('app generator — el ensamblador no nombra motores', () => {
  const emit = async (database?: 'postgres' | 'mongo'): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true, database })
    return tree
  }

  it('el código del ensamblador no menciona typeorm ni motores concretos', () => {
    const source = readFileSync(path.join(__dirname, 'app.ts'), 'utf-8')

    expect(source).not.toMatch(/TypeOrm/)
    expect(source).not.toMatch(/typeorm/)
    expect(source).not.toMatch(/'postgres'|'mongo'/)
  })

  it('postgres registra sus repositorios concretos en el módulo de test-repositories', async () => {
    const tree = await emit('postgres')

    const module = tree.read('apps/demo/libs/backend/tests/infrastructure/test-repositories.module.ts', 'utf-8') ?? ''
    expect(module).toContain('TypeOrmCustomerRepository')
    expect(module).toContain(
      "from '../../src/contexts/sap-licensing/modules/customers/infrastructure/persistence/typeorm/typeorm-customer.repository'"
    )
  })

  it('mongo no cuela repositorios TypeORM en el módulo de test-repositories', async () => {
    const tree = await emit('mongo')

    const module = tree.read('apps/demo/libs/backend/tests/infrastructure/test-repositories.module.ts', 'utf-8') ?? ''
    expect(module).not.toContain('TypeOrm')
  })

  it('postgres alinea la config local y de test con el compose emitido', async () => {
    const tree = await emit('postgres')
    const read = (env: string) =>
      JSON.parse(
        tree.read(
          `apps/demo/libs/backend/src/contexts/shared/infrastructure/config/environments/${env}.json`,
          'utf-8'
        ) ?? '{}'
      )

    // synchronize no se comprueba aquí: lo apaga después el plugin de migraciones, que es su dueño
    expect(read('local').typeorm).toMatchObject({
      port: 5433,
      database: 'app_local',
      username: 'app',
      password: 'local_only_not_a_secret'
    })
    expect(read('test').typeorm).toMatchObject({
      port: 5434,
      database: 'app_test',
      username: 'app',
      password: 'test_only_not_a_secret'
    })
  })

  it('mongo deja su config intacta (su uri la escribe el kernel, no el ensamblador)', async () => {
    const tree = await emit('mongo')

    const local = JSON.parse(
      tree.read('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/environments/local.json', 'utf-8') ??
        '{}'
    )
    expect(local.typeorm).toBeUndefined()
    expect(local.mongo.uri).toContain('mongodb://')
  })
})
