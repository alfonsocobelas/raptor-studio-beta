import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { readFileSync } from 'fs'
import * as path from 'path'
import type { ResourceDefinition } from '@acc/schema'
import { appGenerator, shellSubstitutions } from './app'
import { composeFlat } from './composition'

/**
 * TASK-04 (spec 07): la composición de la app (nav, rutas, dashboard) puede venir de
 * un app-schema registrado (`--app=demo`) y el resultado es idéntico byte a byte al
 * de las opciones planas equivalentes — gate de equivalencia de la fase A.
 */
describe('app generator — opción app (app-schema)', () => {
  const snapshot = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  it('--app=demo emite exactamente lo mismo que las opciones planas equivalentes', async () => {
    const flat = await snapshot({
      name: 'demo',
      models: 'customer,contract,license,project',
      dashboard: true,
      skipInstall: true
    })
    const fromApp = await snapshot({ name: 'demo', app: 'demo', skipInstall: true })

    expect([...fromApp.keys()].sort()).toEqual([...flat.keys()].sort())
    for (const [file, content] of flat) {
      expect(fromApp.get(file)).toBe(content)
    }
  }, 120000)

  it('rechaza combinar --app con models o dashboard (dos fuentes de verdad)', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()

    await expect(appGenerator(tree, { name: 'x', app: 'demo', models: 'contract', skipInstall: true })).rejects.toThrow(
      /mutually exclusive/
    )
    await expect(appGenerator(tree, { name: 'x', app: 'demo', dashboard: true, skipInstall: true })).rejects.toThrow(
      /mutually exclusive/
    )
  })

  it('schema.json declara la opción app', () => {
    const schema = JSON.parse(readFileSync(path.join(__dirname, 'schema.json'), 'utf-8'))

    expect(schema.properties.app.type).toBe('string')
  })
})

describe('shellSubstitutions — nav y rutas derivadas de la composición', () => {
  const model = (name: string, plural: string): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name,
      plural,
      context: 'crm',
      schemaName: 'crm',
      fields: { id: { type: 'uuid', pk: true } }
    }) as ResourceDefinition

  const customer = model('customer', 'customers')
  const contract = model('contract', 'contracts')

  it('el orden de páginas gobierna nav, rutas y ruta por defecto', () => {
    const subs = shellSubstitutions(composeFlat([contract, customer], false))

    expect(subs.defaultRoute).toBe('crm/contracts')
    expect(subs.navItems.indexOf('contracts')).toBeLessThan(subs.navItems.indexOf('customers'))
    expect(subs.routeEntries.indexOf('contracts')).toBeLessThan(subs.routeEntries.indexOf('customers'))
  })

  it('con dashboard, la primera página es la ruta por defecto y encabeza el menú', () => {
    const subs = shellSubstitutions(composeFlat([customer], true))

    expect(subs.defaultRoute).toBe('dashboard')
    expect(subs.navItems).toContain("{ label: 'Dashboard', route: '/dashboard' }")
    expect(subs.routeEntries.indexOf("path: 'dashboard'")).toBeLessThan(subs.routeEntries.indexOf('customers'))
  })
})
