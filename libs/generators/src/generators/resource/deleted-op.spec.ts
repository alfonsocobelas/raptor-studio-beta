import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app/app'
import { resourceGenerator } from './resource'

/**
 * Spec 38 · TASK-03: la columna `deleted_op`. Restaurar devuelve EXACTAMENTE lo que
 * arrastró un borrado (decisión 1), así que cada fila archivada guarda el id de la
 * operación que la tumbó. La pone el caso de uso, nunca un trigger: cero lógica de
 * negocio en Postgres.
 */
describe('resource generator — operación de borrado (spec 38)', () => {
  const emit = async (name: string): Promise<string> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree.read(`out/backend/infrastructure/persistence/typeorm/typeorm-${name}.entity.ts`, 'utf-8') ?? ''
  }

  it('una entidad suave lleva deletedOp junto a deletedAt', async () => {
    const entity = await emit('project')

    expect(entity).toContain("@DeleteDateColumn({ type: 'timestamptz', nullable: true })")
    expect(entity).toContain("@Column('uuid', { name: 'deleted_op', nullable: true })")
    expect(entity).toContain('deletedOp?: string')
  })

  it('una entidad con la escotilla física no lleva ninguna de las dos', async () => {
    const entity = await emit('material')

    expect(entity).not.toContain('DeleteDateColumn')
    expect(entity).not.toContain('deleted_op')
  })
})

describe('app generator — migración de fábrica con la operación (spec 38)', () => {
  const migrationOf = async (models: string): Promise<string> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models, skipInstall: true })
    return (
      tree.read(
        'apps/demo/libs/backend/src/contexts/shared/infrastructure/persistence/typeorm/migrations/1790000000000-InitialSchema.ts',
        'utf-8'
      ) ?? ''
    )
  }

  it('toda tabla suave declara deleted_at y deleted_op', async () => {
    const sql = await migrationOf('customer')

    // la migración alinea los nombres de columna, así que se compara tolerando el relleno
    expect(sql).toMatch(/deleted_at\s+TIMESTAMPTZ NULL/)
    expect(sql).toMatch(/deleted_op\s+UUID NULL/)
  })

  it('la tabla física no declara ninguna de las dos', async () => {
    const sql = await migrationOf('material')

    expect(sql).not.toContain('deleted_at')
    expect(sql).not.toContain('deleted_op')
  })

  // La cascada de las COMPOSICIONES (contactos de customer) se queda: un hijo embebido es
  // del padre y muere con él. Lo que nunca cascadea es una REFERENCIA entre agregados.
  it('las referencias entre agregados siguen en RESTRICT, sin cascada de negocio', async () => {
    const sql = await migrationOf('customer,contract')

    expect(sql).toContain('ON DELETE RESTRICT')
    expect(sql).toMatch(/fk_contracts_customer[\s\S]{0,200}ON DELETE RESTRICT/)
  })
})
