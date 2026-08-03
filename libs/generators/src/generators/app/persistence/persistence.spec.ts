import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { PERSISTENCE, selectPersistence } from './registry'
import { SLOTS } from '../plugins/slots'
import { customer } from '../../resource/models/customer.model'

/**
 * TASK-05 (spec 23): el proveedor de persistencia pasa a ser el DUEÑO de su emisión.
 * Aquí solo se declaran los manifiestos con los datos que hoy están repartidos en
 * `if`s por kernel.ts/app.ts; los consumidores llegan en TASK-06..08.
 */
describe('PERSISTENCE', () => {
  it('registers one manifest per engine, each declaring its own engine', () => {
    expect(Object.keys(PERSISTENCE)).toEqual(['postgres', 'mongo'])
    for (const [engine, provider] of Object.entries(PERSISTENCE)) {
      expect(provider.engine).toBe(engine)
    }
  })

  it('each manifest owns the kernel subtree with its config and shared persistence', () => {
    expect(PERSISTENCE['postgres'].kernelFiles).toBe('files-postgres')
    expect(PERSISTENCE['mongo'].kernelFiles).toBe('files-mongo')
  })

  it('selectPersistence resolves by engine', () => {
    expect(selectPersistence('mongo').engine).toBe('mongo')
    expect(selectPersistence('postgres').engine).toBe('postgres')
  })

  it('covers every provider the database slot offers (nothing choosable without a manifest)', () => {
    expect(SLOTS['database'].providers.map(p => p.value)).toEqual(Object.keys(PERSISTENCE))
  })
})

describe('postgres manifest', () => {
  const postgres = PERSISTENCE['postgres']

  it('aligns the local environment with the postgres of the emitted compose', () => {
    // los valores vivían suelos en app.ts; ahora son del proveedor, que es quien sabe de motores
    const tree = createTreeWithEmptyWorkspace()
    tree.write('config/local.json', JSON.stringify({ env: 'local', typeorm: { host: 'localhost' } }, null, 2))

    postgres.alignEnvironment?.(tree, 'config/local.json', 'local')

    const config = JSON.parse(tree.read('config/local.json', 'utf-8') ?? '{}')
    expect(config.typeorm).toEqual({
      host: 'localhost',
      username: 'app',
      password: 'local_only_not_a_secret',
      database: 'app_local',
      port: 5433,
      synchronize: true
    })
  })

  it('aligns the test environment with the ephemeral postgres of the test compose', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('config/test.json', JSON.stringify({ env: 'test', typeorm: {} }, null, 2))

    postgres.alignEnvironment?.(tree, 'config/test.json', 'test')

    const config = JSON.parse(tree.read('config/test.json', 'utf-8') ?? '{}')
    expect(config.typeorm).toEqual({
      username: 'app',
      password: 'test_only_not_a_secret',
      database: 'app_test',
      port: 5434,
      synchronize: false
    })
  })

  it('leaves a missing config file alone instead of failing', () => {
    const tree = createTreeWithEmptyWorkspace()

    expect(() => postgres.alignEnvironment?.(tree, 'config/nope.json', 'local')).not.toThrow()
  })

  it('names the concrete repository the emitted test module has to register', () => {
    const repository = postgres.testRepository?.(customer)

    expect(repository?.className).toBe('TypeOrmCustomerRepository')
    expect(repository?.importPath).toBe(
      '../../src/contexts/sap-licensing/modules/customers/infrastructure/persistence/typeorm/typeorm-customer.repository'
    )
  })
})

describe('mongo manifest', () => {
  const mongo = PERSISTENCE['mongo']

  it('declares no environment alignment nor concrete repository yet (spec 06 pending)', () => {
    // honestidad del manifiesto: lo que el motor todavía no emite se ve como hueco, no se inventa
    expect(mongo.alignEnvironment).toBeUndefined()
    expect(mongo.testRepository).toBeUndefined()
  })
})
