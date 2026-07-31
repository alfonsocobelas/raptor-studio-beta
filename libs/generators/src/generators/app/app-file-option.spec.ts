import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { readFileSync, writeFileSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { appGenerator } from './app'
import { APPS } from './apps/registry'

/**
 * TASK-01 (spec 11): `--appFile` carga el app-schema desde un JSON del usuario
 * (lo que descarga el wizard del estudio) con el mismo gate y el mismo camino
 * de render que `--app`.
 */
describe('app generator — opción appFile', () => {
  const snapshot = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  const writeAppJson = (content: unknown): string => {
    const dir = mkdtempSync(path.join(tmpdir(), 'appfile-'))
    const file = path.join(dir, 'cliente.app.json')
    writeFileSync(file, JSON.stringify(content))
    return file
  }

  it('un JSON equivalente a boutique emite byte a byte lo mismo que --app=boutique', async () => {
    const file = writeAppJson(APPS['boutique'])

    const fromRegistry = await snapshot({ name: 'demo', app: 'boutique', skipInstall: true })
    const fromFile = await snapshot({ name: 'demo', appFile: file, skipInstall: true })

    expect([...fromFile.keys()].sort()).toEqual([...fromRegistry.keys()].sort())
    for (const [f, content] of fromRegistry) {
      expect(fromFile.get(f)).toBe(content)
    }
  }, 120000)

  it('falla si el fichero no existe', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()

    await expect(appGenerator(tree, { name: 'x', appFile: '/no/existe.json', skipInstall: true })).rejects.toThrow(
      /no existe|ENOENT|not found/i
    )
  })

  it('falla si el JSON no pasa el gate estructural', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const file = writeAppJson({ schemaVersion: 1, name: 'Bad Name', pages: [] })

    await expect(appGenerator(tree, { name: 'x', appFile: file, skipInstall: true })).rejects.toThrow(
      /kebab-case|at least one page/
    )
  })

  it('rechaza combinar appFile con app o composición plana', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const file = writeAppJson(APPS['boutique'])

    await expect(
      appGenerator(tree, { name: 'x', appFile: file, app: 'boutique', skipInstall: true })
    ).rejects.toThrow(/mutually exclusive/)
    await expect(
      appGenerator(tree, { name: 'x', appFile: file, models: 'garment', skipInstall: true })
    ).rejects.toThrow(/mutually exclusive/)
  })

  it('schema.json declara la opción appFile', () => {
    const schema = JSON.parse(readFileSync(path.join(__dirname, 'schema.json'), 'utf-8'))

    expect(schema.properties.appFile.type).toBe('string')
  })
})
