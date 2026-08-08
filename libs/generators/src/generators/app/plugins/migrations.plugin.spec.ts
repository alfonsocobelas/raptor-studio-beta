import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { contract } from '../../resource/models/contract.model'
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

  it('un defaultRaw escrito para TS pierde sus comillas dobles en el SQL de la migración', () => {
    // contract.subSolutionAreas declara defaultRaw `"'{}'"` (listo para `default: () => "..."`
    // en la entidad TypeORM); en SQL las comillas dobles son una REFERENCIA A COLUMNA y
    // Postgres aborta la migración: cannot use column reference in DEFAULT expression.
    migrationsPlugin.apply?.(tree, { ...contextFor(tree), models: [contract] })

    const migration = tree.read(`${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`, 'utf-8') ?? ''

    expect(migration).toContain("DEFAULT '{}'")
    expect(migration).not.toContain('DEFAULT "')
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

  it('the attachments table hangs off its record with a cascading foreign key (spec 16)', () => {
    migrationsPlugin.apply?.(tree, {
      ...contextFor(tree),
      models: [{ ...supplier, attachments: true, detail: {} } as typeof supplier]
    })

    const migration = tree.read(`${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`, 'utf-8') ?? ''

    expect(migration).toContain('supplier_id UUID         NOT NULL')
    expect(migration).toContain('CONSTRAINT fk_suppliers_attachments_supplier')
    expect(migration).toContain('ON DELETE CASCADE')
    expect(migration).toContain('idx_suppliers_attachments_supplier_id')
  })

  /**
   * Defecto 18 (visto en fincaraiz): `agente_id` y `propiedad_id` salían como
   * UUID sueltos. Sin FK, la base acepta visitas de propiedades que no existen y
   * borrar un padre deja huérfanos — la integridad no es opcional.
   */
  it('una referencia emite su clave ajena, con índice y sin borrado en cascada', () => {
    const agente = { ...supplier, name: 'agente', plural: 'agentes' } as typeof supplier
    const propiedad = {
      ...supplier,
      name: 'propiedad',
      plural: 'propiedades',
      fields: {
        ...supplier.fields,
        agenteId: { type: 'uuid', required: true, relation: { to: 'agente', kind: 'reference' } }
      }
    } as unknown as typeof supplier

    migrationsPlugin.apply?.(tree, { ...contextFor(tree), models: [agente, propiedad] })
    const migration = tree.read(`${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`, 'utf-8') ?? ''

    // el renderizado alinea la primera palabra, así que se comprueba sin el espaciado
    expect(migration).toMatch(/fk_propiedades_agente FOREIGN KEY \(agente_id\)/)
    expect(migration).toMatch(/REFERENCES \w+\.agentes \(id\)/)
    // un agente con propiedades NO se borra en silencio: la cascada es de adjuntos, no de negocio
    expect(migration).toContain('ON DELETE RESTRICT')
    expect(migration).toContain('CREATE INDEX idx_propiedades_agente_id')
  })

  /**
   * Defecto: el orden de las tablas venía del orden de las PÁGINAS, así que si el
   * panel mencionaba antes al hijo, la migración creaba la tabla con la FK antes
   * que la del padre y fallaba con «relation does not exist». Las dependencias
   * mandan sobre el orden de aparición.
   */
  it('crea las tablas padre antes que las hijas, aunque el diseño las liste al revés', () => {
    const agente = { ...supplier, name: 'agente', plural: 'agentes' } as typeof supplier
    const propiedad = {
      ...supplier,
      name: 'propiedad',
      plural: 'propiedades',
      fields: {
        ...supplier.fields,
        agenteId: { type: 'uuid', required: true, relation: { to: 'agente', kind: 'reference' } }
      }
    } as unknown as typeof supplier

    // hijo primero, como llega desde un panel que menciona propiedades antes que agentes
    migrationsPlugin.apply?.(tree, { ...contextFor(tree), models: [propiedad, agente] })
    const migration = tree.read(`${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`, 'utf-8') ?? ''

    expect(migration.search(/CREATE TABLE \w+\.agentes/)).toBeLessThan(
      migration.search(/CREATE TABLE \w+\.propiedades/)
    )
  })

  it('las borra en orden inverso: el hijo antes que el padre', () => {
    const agente = { ...supplier, name: 'agente', plural: 'agentes' } as typeof supplier
    const propiedad = {
      ...supplier,
      name: 'propiedad',
      plural: 'propiedades',
      fields: {
        ...supplier.fields,
        agenteId: { type: 'uuid', required: true, relation: { to: 'agente', kind: 'reference' } }
      }
    } as unknown as typeof supplier

    migrationsPlugin.apply?.(tree, { ...contextFor(tree), models: [propiedad, agente] })
    const migration = tree.read(`${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`, 'utf-8') ?? ''
    const down = migration.slice(migration.indexOf('async down'))

    expect(down.search(/DROP TABLE IF EXISTS \w+\.propiedades/)).toBeLessThan(
      down.search(/DROP TABLE IF EXISTS \w+\.agentes/)
    )
  })
})
