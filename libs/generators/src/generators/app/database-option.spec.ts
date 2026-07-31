import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { readFileSync } from 'fs'
import * as path from 'path'
import { appGenerator } from './app'

/**
 * TASK-01 (spec 06): la opción `database` existe en el contrato del generador de app
 * y Postgres es el camino por defecto — pedirlo explícitamente debe dejar la salida
 * byte a byte idéntica a no pedir nada.
 */
describe('app generator — opción database', () => {
  const snapshot = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  it('database=postgres emite exactamente lo mismo que omitir la opción', async () => {
    const implicit = await snapshot({ name: 'demo', models: 'contract', skipInstall: true })
    const explicit = await snapshot({ name: 'demo', models: 'contract', skipInstall: true, database: 'postgres' })

    expect([...explicit.keys()].sort()).toEqual([...implicit.keys()].sort())
    for (const [file, content] of implicit) {
      expect(explicit.get(file)).toBe(content)
    }
  }, 60000)

  it('schema.json declara la opción con default postgres', () => {
    const schema = JSON.parse(readFileSync(path.join(__dirname, 'schema.json'), 'utf-8'))

    expect(schema.properties.database.default).toBe('postgres')
    const values = schema.properties.database['x-prompt'].items.map((i: { value: string }) => i.value)
    expect(values).toEqual(['postgres', 'mongo'])
  })
})
