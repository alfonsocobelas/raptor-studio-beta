import { DesignStore } from './design-store'

/**
 * Spec 46 TASK-06: la matriz de accesos vive en el store como cualquier pieza del diseño
 * (patrón state): editable por entidad, gate de defineResource en cada mutación y viaja
 * en el export. Fichero propio para no pisar el spec del store.
 */
describe('DesignStore — matriz de accesos (spec 46)', () => {
  let store: DesignStore

  beforeEach(() => {
    store = new DesignStore()
  })

  it('setResourceAccess guarda la matriz en la entidad', () => {
    store.addResource('Factura')

    expect(store.setResourceAccess('factura', { view: ['user'], manage: [] })).toBe(true)
    expect(store.resources()[0].access).toEqual({ view: ['user'], manage: [] })
    expect(store.lastError()).toBeNull()
  })

  it('setResourceAccess con undefined la quita (vuelve la política actual)', () => {
    store.addResource('Factura')
    store.setResourceAccess('factura', { view: ['user'] })

    expect(store.setResourceAccess('factura', undefined)).toBe(true)
    expect('access' in store.resources()[0]).toBe(false)
  })

  it('rechaza una matriz que no pasa el gate (transitions sin máquina) y conserva la anterior', () => {
    store.addResource('Factura')
    store.setResourceAccess('factura', { view: ['user'] })

    const ok = store.setResourceAccess('factura', { transitions: { aprobar: ['user'] } })

    expect(ok).toBe(false)
    expect(store.resources()[0].access).toEqual({ view: ['user'] })
    expect(store.lastError()).toContain('state machine')
  })

  it('guarda la matriz granular completa create/edit/delete (spec 49)', () => {
    store.addResource('Factura')
    const matriz = {
      view: ['user' as const, 'viewer' as const],
      create: ['user' as const],
      edit: ['user' as const],
      delete: []
    }

    expect(store.setResourceAccess('factura', matriz)).toBe(true)
    expect(store.resources()[0].access).toEqual(matriz)
    expect(store.lastError()).toBeNull()
  })

  it('rechaza roles ilegales también en las claves granulares', () => {
    store.addResource('Factura')

    const ok = store.setResourceAccess('factura', { delete: ['admin' as never] })

    expect(ok).toBe(false)
    expect(store.lastError()).toContain('grantable')
  })

  it('la matriz viaja al resource expandido del export (la frontera la ve)', () => {
    store.addResource('Factura')
    store.setResourceAccess('factura', { manage: [] })

    const exported = JSON.parse(store.exportJson()) as { resources: { access?: unknown }[] }

    expect(exported.resources[0].access).toEqual({ manage: [] })
  })

  it('applyExternal restaura la matriz que venga en el diseño', () => {
    const ok = store.applyExternal({
      appName: 'ventas',
      resources: [
        {
          name: 'factura',
          plural: 'facturas',
          labelSingular: 'Factura',
          labelPlural: 'Facturas',
          gender: 'f',
          fields: [{ name: 'nombre', label: 'Nombre', type: 'string' }],
          access: { view: ['user'] }
        }
      ],
      pages: []
    })

    expect(ok).toBe(true)
    expect(store.resources()[0].access).toEqual({ view: ['user'] })
  })
})
