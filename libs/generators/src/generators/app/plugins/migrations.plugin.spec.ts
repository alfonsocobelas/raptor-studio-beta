import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { supplier } from '../../resource/models/supplier.model'
import { vehicle } from '../../resource/models/vehicle.model'
import { migrationsPlugin } from './migrations.plugin'
import type { PluginContext } from './plugin'

const ENVS_DIR = 'backend/contexts/shared/infrastructure/config/environments'
const MIGRATIONS_DIR = 'backend/contexts/shared/infrastructure/persistence/typeorm/migrations'

function contextFor(tree: Tree): PluginContext {
  return {
    root: '.',
    appName: 'demo',
    backendSrc: 'backend',
    frontendSrc: 'frontend',
    models: [vehicle],
    scope: '@app'
  }
}

describe('migrationsPlugin.apply', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    for (const env of ['local', 'test', 'prod']) {
      tree.write(`${ENVS_DIR}/${env}.json`, JSON.stringify({ typeorm: { synchronize: true } }))
    }
  })

  it('turns synchronize off in every environment', () => {
    migrationsPlugin.apply?.(tree, contextFor(tree))

    for (const env of ['local', 'test', 'prod']) {
      const config = JSON.parse(tree.read(`${ENVS_DIR}/${env}.json`, 'utf-8') ?? '{}') as {
        typeorm: { synchronize: boolean }
      }
      expect(config.typeorm.synchronize).toBe(false)
    }
  })

  it('emits the initial migration derived from the model', () => {
    migrationsPlugin.apply?.(tree, contextFor(tree))

    const migration = tree.read(`${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`, 'utf-8') ?? ''

    // esquema y tabla del modelo
    expect(migration).toContain('CREATE SCHEMA IF NOT EXISTS dealership')
    expect(migration).toContain('CREATE TABLE dealership.vehicles')
    // longitud resuelta desde las constraints del recurso (VIN.MAX = 17)
    expect(migration).toContain('VARCHAR(17)')
    // unicidad y pk con constraints nombradas
    expect(migration).toContain('CONSTRAINT uq_vehicles_vin UNIQUE (vin)')
    expect(migration).toContain('CONSTRAINT pk_vehicles PRIMARY KEY (id)')
    // snake_case en columnas camelCase y down con DROP … IF EXISTS
    expect(migration).toContain('DROP TABLE IF EXISTS dealership.vehicles')
  })

  it('emits a partial unique index for optional unique fields (ifPresent semantics)', () => {
    migrationsPlugin.apply?.(tree, { ...contextFor(tree), models: [supplier] })

    const migration = tree.read(`${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`, 'utf-8') ?? ''

    // taxId es unique opcional: dos filas sin CIF deben poder convivir (canon uq_customers_tax_id)
    expect(migration).not.toContain('CONSTRAINT uq_suppliers_tax_id UNIQUE (tax_id)')
    expect(migration).toContain('CREATE UNIQUE INDEX uq_suppliers_tax_id')
    expect(migration).toContain("WHERE tax_id <> ''")
  })

  it('declares the migration scripts in its manifest', () => {
    expect(Object.keys(migrationsPlugin.scripts ?? {})).toEqual(
      expect.arrayContaining(['migration:generate', 'migration:run', 'migration:revert'])
    )
  })
})
