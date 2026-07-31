import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

describe('DesignStore — lienzo en blanco', () => {
  it('arranca VACÍO: sin recursos, sin páginas, sin nada de demos', () => {
    const store = new DesignStore()

    expect(store.resources()).toEqual([])
    expect(store.definition().pages).toEqual([])
    expect(store.composition().pages).toEqual([])
  })

  it('addTable crea la entidad Y su página, y la composición la refleja', () => {
    const store = new DesignStore()

    const ok = store.addTable('Vehículo')

    expect(ok).toBe(true)
    expect(store.resources().map(r => r.name)).toEqual(['vehiculo'])
    expect(store.composition().pages).toEqual([
      expect.objectContaining({ kind: 'resource', resource: 'vehiculo' })
    ])
    expect(store.composition().models[0].labels?.singular).toBe('Vehículo')
  })

  it('addKpi crea el dashboard si falta y añade la tarjeta', () => {
    const store = new DesignStore()
    store.addTable('Vehículo')

    store.addKpi('vehiculo')

    expect(store.composition().pages[0].kind).toBe('dashboard')
    expect(store.composition().kpiModels.map(m => m.name)).toEqual(['vehiculo'])
  })

  it('removePage de una página de recurso elimina TAMBIÉN la entidad y sus KPIs', () => {
    const store = new DesignStore()
    store.addTable('Vehículo')
    store.addTable('Conductor')
    store.addKpi('vehiculo')

    store.removePage(1) // página de vehiculo (0 = dashboard)

    expect(store.resources().map(r => r.name)).toEqual(['conductor'])
    expect(store.composition().kpiModels).toEqual([])
    expect(store.composition().pages.some(p => p.kind === 'resource' && p.resource === 'vehiculo')).toBe(false)
  })

  it('puede quedarse vacío otra vez (borrar la última página es válido en el lienzo)', () => {
    const store = new DesignStore()
    store.addTable('Vehículo')

    store.removePage(0)

    expect(store.definition().pages).toEqual([])
    expect(store.resources()).toEqual([])
  })

  it('edición de campos: añadir, renombrar, cambiar tipo y quitar', () => {
    const store = new DesignStore()
    store.addTable('Vehículo')

    store.addField('vehiculo')
    store.updateField('vehiculo', 1, { name: 'matricula', label: 'Matrícula', type: 'string' })
    store.addField('vehiculo')
    store.updateField('vehiculo', 2, { name: 'plazas', label: 'Plazas', type: 'integer' })
    store.removeField('vehiculo', 0)

    const fields = store.resources()[0].fields
    expect(fields.map(f => f.name)).toEqual(['matricula', 'plazas'])
    expect(store.composition().models[0].fields['plazas'].column).toMatchObject({ type: 'int' })
  })

  it('rechaza duplicar el nombre de entidad', () => {
    const store = new DesignStore()
    store.addTable('Vehículo')

    expect(store.addTable('Vehículo')).toBe(false)
    expect(store.lastError()).toMatch(/existe/i)
  })

  it('applyExternal (chat) sustituye recursos y composición de una vez', () => {
    const store = new DesignStore()

    const ok = store.applyExternal({
      appName: 'flotas',
      resources: [
        {
          name: 'conductor',
          plural: 'conductores',
          labelSingular: 'Conductor',
          labelPlural: 'Conductores',
          gender: 'm',
          fields: [{ name: 'nombre', label: 'Nombre', type: 'string' }]
        }
      ],
      pages: [
        { kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'conductor' }] },
        { kind: 'resource', resource: 'conductor' }
      ]
    })

    expect(ok).toBe(true)
    expect(store.appName()).toBe('flotas')
    expect(store.composition().pages).toHaveLength(2)
  })

  it('applyExternal rechaza páginas que referencian entidades inexistentes', () => {
    const store = new DesignStore()

    const ok = store.applyExternal({
      appName: 'x',
      resources: [],
      pages: [{ kind: 'resource', resource: 'fantasma' }]
    })

    expect(ok).toBe(false)
    expect(store.definition().pages).toEqual([])
  })
})
