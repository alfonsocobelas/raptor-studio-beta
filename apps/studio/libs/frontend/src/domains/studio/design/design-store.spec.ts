import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

describe('DesignStore — lienzo en blanco por vistas y bloques', () => {
  it('arranca VACÍO: sin recursos, sin vistas', () => {
    const store = new DesignStore()

    expect(store.resources()).toEqual([])
    expect(store.pages()).toEqual([])
  })

  it('crea una vista en blanco: existe la vista y no tiene bloques', () => {
    const store = new DesignStore()

    store.addPage('blank', 'Inicio')

    expect(store.pages()).toEqual([{ title: 'Inicio', blocks: [] }])
  })

  it('el preset «Listado» crea la entidad y su tabla dentro de la vista', () => {
    const store = new DesignStore()

    store.addPage('list', 'Vehículos')

    expect(store.resources().map(r => r.name)).toEqual(['vehiculo'])
    expect(store.pages()[0].blocks).toEqual([{ kind: 'table', resource: 'vehiculo', width: 'full' }])
  })

  it('el preset «Ficha» compone métricas + datos + adjuntos', () => {
    const store = new DesignStore()

    store.addPage('detail', 'Cliente')

    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['kpis', 'fields', 'attachments'])
  })

  it('la tabla es un bloque opcional: se añade y se quita sin tocar la vista', () => {
    const store = new DesignStore()
    store.addPage('blank', 'Panel')
    store.addResource('Pedido')

    store.addBlock(0, { kind: 'table', resource: 'pedido' })
    store.addBlock(0, { kind: 'attachments', resource: 'pedido' })
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['table', 'attachments'])

    store.removeBlock(0, 0)
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['attachments'])
    expect(store.pages()).toHaveLength(1)
    expect(store.resources().map(r => r.name)).toEqual(['pedido'])
  })

  it('mueve bloques dentro de la vista (orden = composición)', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas')

    store.moveBlock(0, 1, 0)

    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['table', 'kpis'])
  })

  it('borrar una vista no borra la entidad si otra la usa', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Catálogo')
    store.addBlock(1, { kind: 'cards', resource: 'pedido' })

    store.removePage(0)

    expect(store.pages()).toHaveLength(1)
    // la entidad sobrevive porque la galería de la otra vista la sigue usando
    expect(store.resources().map(r => r.name)).toEqual(['pedido'])
  })

  it('el app-schema exportable solo incluye las vistas generables, y avisa del resto', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Notas')
    store.addBlock(1, { kind: 'text', text: 'Aviso para el equipo' })

    const exported = store.toAppSchema()

    expect(exported.pages.map(p => p.kind)).toEqual(['resource'])
    expect(store.notGenerable()).toEqual([{ page: 'Notas', blocks: ['text'] }])
  })

  it('la galería ya es generable: viaja al app-schema como página de tarjetas', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Catálogo')
    store.addBlock(1, { kind: 'cards', resource: 'pedido' })

    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource', 'cards'])
    expect(store.resources()[0].gallery).toBe(true)
    expect(store.notGenerable()).toEqual([])
  })

  it('una vista con solo KPIs se exporta como dashboard', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Resumen')
    store.addBlock(1, { kind: 'kpis', resources: ['pedido'] })

    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource', 'dashboard'])
  })

  it('los adjuntos de un bloque marcan la entidad para el generador', () => {
    const store = new DesignStore()
    store.addPage('detail', 'Cliente')

    expect(store.resources()[0].attachments).toBe(true)
  })

  it('edición de campos de una entidad del diseño', () => {
    const store = new DesignStore()
    store.addPage('list', 'Vehículo')

    store.addField('vehiculo')
    store.updateField('vehiculo', 1, { name: 'matricula', label: 'Matrícula', type: 'string' })
    store.removeField('vehiculo', 0)

    expect(store.resources()[0].fields.map(f => f.name)).toEqual(['matricula'])
  })

  it('applyExternal (chat) sustituye entidades y vistas de una vez', () => {
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
      pages: [{ title: 'Conductores', blocks: [{ kind: 'table', resource: 'conductor', width: 'full' }] }]
    })

    expect(ok).toBe(true)
    expect(store.appName()).toBe('flotas')
    expect(store.pages()[0].title).toBe('Conductores')
  })

  it('applyExternal rechaza bloques que referencian entidades inexistentes', () => {
    const store = new DesignStore()

    const ok = store.applyExternal({
      appName: 'x',
      resources: [],
      pages: [{ title: 'Rota', blocks: [{ kind: 'table', resource: 'fantasma' }] }]
    })

    expect(ok).toBe(false)
    expect(store.pages()).toEqual([])
  })
})
