import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { MODELS } from '../../resource/models/registry'
import { appGenerator } from '../app'
import { migrationsPlugin } from './migrations.plugin'
import type { PluginContext } from './plugin'

// del REGISTRO, no del fichero del modelo: es lo que ve la generación real, ya con `code`
// expandido a campo (spec 19). Importar el crudo probaría algo que nunca ocurre.
const client = MODELS['client']
const vehicle = MODELS['vehicle']

const ENVS_DIR = 'backend/contexts/shared/infrastructure/config/environments'
const MIGRATIONS_DIR = 'backend/contexts/shared/infrastructure/persistence/typeorm/migrations'
const MIGRATION = `${MIGRATIONS_DIR}/1790000000000-InitialSchema.ts`

/**
 * Spec 19 TASK-03: el código de negocio necesita dos cosas en la base — la SECUENCIA que
 * reparte los números (el contador que hace atómico el `nextval`) y la COLUMNA donde se
 * guarda el código ya formateado, con UNIQUE como última línea de defensa.
 */
describe('migración — código de negocio', () => {
  const migrate = (models: PluginContext['models']): string => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    for (const env of ['local', 'test', 'prod']) {
      tree.write(`${ENVS_DIR}/${env}.json`, JSON.stringify({ typeorm: { synchronize: true } }))
    }
    migrationsPlugin.apply?.(tree, {
      root: '.',
      appName: 'demo',
      backendSrc: 'backend',
      frontendSrc: 'frontend',
      models,
      scope: '@app',
      sessionStore: 'postgres',
      infra: 'none'
    })
    return tree.read(MIGRATION, 'utf-8') ?? ''
  }

  it('crea la secuencia de la entidad que declara código', () => {
    const migration = migrate([client])

    expect(migration).toContain('CREATE SEQUENCE dealership.clients_code_seq')
  })

  it('añade la columna code, única y obligatoria', () => {
    const migration = migrate([client])

    expect(migration).toMatch(/code\s+VARCHAR\(\d+\) NOT NULL/)
    // el renderizado alinea la primera palabra de cada columna, así que el espaciado varía
    expect(migration).toMatch(/CONSTRAINT\s+uq_clients_code UNIQUE \(code\)/)
  })

  it('un modelo sin código no gana ni secuencia ni columna', () => {
    const migration = migrate([vehicle])

    expect(migration).not.toContain('_code_seq')
    expect(migration).not.toContain('uq_vehicles_code')
  })

  it('la secuencia se borra en el down, con la tabla', () => {
    const migration = migrate([client])

    expect(migration).toContain('DROP SEQUENCE IF EXISTS dealership.clients_code_seq')
  })
})

/**
 * Mongo no tiene secuencias, así que un modelo con `code` sobre mongo no se puede emitir.
 * Falla ANTES de escribir nada, con el mismo criterio que los adjuntos: mejor un error claro
 * al generar que una app a medias que revienta en el primer alta.
 */
describe('código de negocio + mongo', () => {
  it('se rechaza antes de emitir nada, nombrando el motor que sí lo soporta', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const preexisting = tree.listChanges().length

    await expect(
      appGenerator(tree, { name: 'demo', models: 'client', database: 'mongo', skipInstall: true })
    ).rejects.toThrow(/code.*postgres/is)
    expect(tree.listChanges()).toHaveLength(preexisting)
  })
})
