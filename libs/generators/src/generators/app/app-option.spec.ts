import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { readFileSync } from 'fs'
import * as path from 'path'
import type { ResourceDefinition } from '@raptor/schema'
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

  it('tolera los defaults que rellena Nx (dashboard=false no es composición explícita)', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()

    await expect(
      appGenerator(tree, {
        name: 'x',
        app: 'demo',
        dashboard: false,
        plugins: 'none',
        ui: 'spartan',
        skipInstall: true
      })
    ).resolves.toBeDefined()
  }, 120000)

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

describe('shellSubstitutions — ruta de la ficha (spec 16)', () => {
  const model = (name: string, plural: string, detail?: object): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name,
      plural,
      context: 'crm',
      schemaName: 'crm',
      fields: { id: { type: 'uuid', pk: true } },
      ...(detail ? { detail } : {})
    }) as ResourceDefinition

  it('registra <ruta>/:id cuando el recurso declara ficha', () => {
    const subs = shellSubstitutions(composeFlat([model('customer', 'customers', {})], false))

    expect(subs.routeEntries).toContain("path: 'crm/customers/:id'")
    expect(subs.routeEntries).toContain('CustomerDetailComponent')
  })

  it('la ficha NO añade entrada de menú: es un drill-down, no navegación de primer nivel', () => {
    const subs = shellSubstitutions(composeFlat([model('customer', 'customers', {})], false))

    expect(subs.navItems.match(/route:/g)).toHaveLength(1)
  })

  it('sin ficha declarada no hay ruta de detalle', () => {
    const subs = shellSubstitutions(composeFlat([model('customer', 'customers')], false))

    expect(subs.routeEntries).not.toContain(':id')
  })

  it('la ficha se declara DESPUÉS del listado para que la ruta específica no la eclipse', () => {
    const subs = shellSubstitutions(composeFlat([model('customer', 'customers', {})], false))

    expect(subs.routeEntries.indexOf("path: 'crm/customers'")).toBeLessThan(
      subs.routeEntries.indexOf("path: 'crm/customers/:id'")
    )
  })
})

describe('shellSubstitutions — ruta de la galería (spec 17)', () => {
  const model = (extra: object = {}): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name: 'customer',
      plural: 'customers',
      context: 'crm',
      schemaName: 'crm',
      fields: { id: { type: 'uuid', pk: true } },
      ...extra
    }) as ResourceDefinition

  it('registra <ruta>/galeria con su entrada de menú', () => {
    const subs = shellSubstitutions(composeFlat([model({ gallery: {} })], false))

    expect(subs.routeEntries).toContain("path: 'crm/customers/galeria'")
    expect(subs.routeEntries).toContain('CustomersGalleryComponent')
    expect(subs.navItems).toContain("{ label: 'customers · galería', route: '/crm/customers/galeria' }")
  })

  it('la galería va ANTES de :id, o la ficha capturaría «galeria» como id', () => {
    const subs = shellSubstitutions(composeFlat([model({ gallery: {}, detail: {} })], false))

    expect(subs.routeEntries.indexOf('customers/galeria')).toBeLessThan(subs.routeEntries.indexOf('customers/:id'))
  })
})

describe('shellSubstitutions — página-formulario (spec 48)', () => {
  const model = (extra: object = {}): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name: 'customer',
      plural: 'customers',
      context: 'crm',
      schemaName: 'crm',
      fields: { id: { type: 'uuid', pk: true } },
      ...extra
    }) as ResourceDefinition

  const withFormPage = (m: ResourceDefinition) => {
    const flat = composeFlat([m], false)
    return {
      ...flat,
      pages: [...flat.pages, { kind: 'form' as const, resource: m.name, label: 'Solicitud' }]
    }
  }

  it('registra alta y edición con su entrada de menú', () => {
    const subs = shellSubstitutions(withFormPage(model({ form: {} })))

    expect(subs.routeEntries).toContain("path: 'crm/customers/formulario'")
    expect(subs.routeEntries).toContain("path: 'crm/customers/formulario/:id'")
    expect(subs.routeEntries).toContain('CustomerFormPageComponent')
    expect(subs.navItems).toContain("{ label: 'Solicitud', route: '/crm/customers/formulario' }")
  })

  it('el formulario va ANTES de :id, o la ficha capturaría «formulario» como id', () => {
    const subs = shellSubstitutions(withFormPage(model({ form: {}, detail: {} })))

    expect(subs.routeEntries.indexOf('customers/formulario')).toBeLessThan(subs.routeEntries.indexOf('customers/:id'))
  })

  it('sin bandera form no hay rutas de formulario', () => {
    const subs = shellSubstitutions(composeFlat([model()], false))

    expect(subs.routeEntries).not.toContain('formulario')
  })
})

describe('shellSubstitutions — vista SOLO de galería (spec 17)', () => {
  const tratamiento = {
    schemaVersion: 1,
    name: 'tratamiento',
    plural: 'tratamientos',
    context: 'clinica',
    schemaName: 'clinica',
    labels: { singular: 'Tratamiento', plural: 'Tratamientos' },
    gallery: {},
    fields: { id: { type: 'uuid', pk: true } }
  } as unknown as ResourceDefinition

  const composed = {
    models: [tratamiento],
    pages: [{ kind: 'cards' as const, resource: 'tratamiento', label: 'Catálogo' }],
    dashboard: false,
    dashboardBlocks: [],
    themeId: 'neutral'
  }

  it('emite la galería y NO el listado: la vista no pidió tabla', () => {
    const subs = shellSubstitutions(composed)

    expect(subs.routeEntries).toContain('clinica/tratamientos/galeria')
    expect(subs.routeEntries).not.toContain("path: 'clinica/tratamientos',")
    expect(subs.defaultRoute).toBe('clinica/tratamientos/galeria')
  })

  it('el menú lleva una sola entrada, con el título de la vista', () => {
    const subs = shellSubstitutions(composed)

    expect(subs.navItems).toBe("  { label: 'Catálogo', route: '/clinica/tratamientos/galeria' }")
  })
})
