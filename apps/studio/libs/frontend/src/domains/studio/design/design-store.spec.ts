import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'
import { DRAFT_FIELD_TYPES } from '@app/shared/domain'

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

  it('el preset «Ficha» compone los datos del registro y sus ficheros', () => {
    const store = new DesignStore()

    store.addPage('detail', 'Cliente')

    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['fields', 'attachments'])
  })

  it('la tabla es un bloque opcional: se añade y se quita sin tocar la vista', () => {
    const store = new DesignStore()
    store.addPage('blank', 'Panel')
    store.addResource('Pedido')

    store.addBlock(0, { kind: 'table', resource: 'pedido' })
    store.addBlock(0, { kind: 'kpis', resources: ['pedido'] })
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['table', 'kpis'])

    store.removeBlock(0, 0)
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['kpis'])
    expect(store.pages()).toHaveLength(1)
    expect(store.resources().map(r => r.name)).toEqual(['pedido'])
  })

  it('los KPIs no se duplican: soltarlos donde ya hay se suma al bloque existente', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas') // deja kpis:[venta] + table:venta
    store.addResource('Cliente')

    // lo que manda el lienzo es la entidad de la vista, que ya tiene su KPI
    const added = store.addBlock(0, { kind: 'kpis', resources: ['venta'] })

    expect(added).toBe(true)
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['kpis', 'table'])
    expect(store.pages()[0].blocks[0].resources).toEqual(['venta', 'cliente'])
  })

  it('si la entidad que llega falta, es esa la que se suma y no otra', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas')
    store.addResource('Cliente')
    store.addResource('Proveedor')

    store.addBlock(0, { kind: 'kpis', resources: ['proveedor'] })

    expect(store.pages()[0].blocks[0].resources).toEqual(['venta', 'proveedor'])
  })

  it('con todas las entidades ya medidas, el bloque no cambia y dice por qué', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas')

    const added = store.addBlock(0, { kind: 'kpis', resources: ['venta'] })

    expect(added).toBe(false)
    expect(store.pages()[0].blocks[0].resources).toEqual(['venta'])
    expect(store.lastError()).toContain('Ventas')
  })

  it('un bloque puede caer en un hueco concreto, no siempre al final', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas')
    const before = store.pages()[0].blocks.map(b => b.kind)

    store.addBlock(0, { kind: 'cards', resource: 'venta' }, 1)

    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual([before[0], 'cards', before[1]])
  })

  it('sin hueco indicado el bloque se apila al final, como siempre', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas')
    const before = store.pages()[0].blocks.map(b => b.kind)

    store.addBlock(0, { kind: 'cards', resource: 'venta' })

    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual([...before, 'cards'])
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

  it('un bloque de texto junto a una tabla se convierte en la entradilla de esa pantalla', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')
    store.addBlock(0, { kind: 'text', text: 'Pacientes dados de alta este año' })

    expect(store.resources()[0].subtitle).toBe('Pacientes dados de alta este año')
    expect(store.notGenerable()).toEqual([])
  })

  it('un texto suelto, sin tabla ni galería, sigue sin ser una pantalla', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')
    store.addPage('blank', 'Notas')
    store.addBlock(1, { kind: 'text', text: 'Recordatorio del equipo' })

    expect(store.notGenerable()).toEqual([{ page: 'Notas', blocks: ['text'] }])
  })

  it('la ficha es OTRA pantalla: añadir «Datos» a una vista con tabla crea su propia vista', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')

    store.addBlock(0, { kind: 'fields', resource: 'paciente' })

    expect(store.pages().map(p => p.title)).toEqual(['Pacientes', 'Ficha de paciente'])
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['table'])
    expect(store.pages()[1].blocks.map(b => b.kind)).toEqual(['fields'])
  })

  it('la vista de ficha no es navegación de primer nivel: no sale en el menú', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')
    store.addBlock(0, { kind: 'fields', resource: 'paciente' })

    expect(store.pages()[1].drillDown).toBe(true)
    expect(store.menuPages().map(p => p.title)).toEqual(['Pacientes'])
  })

  it('los adjuntos van a la ficha, no al listado', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')
    store.addBlock(0, { kind: 'fields', resource: 'paciente' })

    store.addBlock(0, { kind: 'attachments', resource: 'paciente' })

    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['table'])
    expect(store.pages()[1].blocks.map(b => b.kind)).toEqual(['fields', 'attachments'])
  })

  it('una segunda ficha de la misma entidad reutiliza la vista existente', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')
    store.addBlock(0, { kind: 'fields', resource: 'paciente' })
    store.addBlock(0, { kind: 'fields', resource: 'paciente' })

    expect(store.pages()).toHaveLength(2)
  })

  it('el preset «Ficha» crea directamente una vista de detalle', () => {
    const store = new DesignStore()
    store.addPage('detail', 'Cliente')

    expect(store.pages()[0].drillDown).toBe(true)
    expect(store.menuPages()).toEqual([])
  })

  it('al pasar una columna a enum se le dan valores de partida: un enum vacío no se genera', () => {
    const store = new DesignStore()
    store.addPage('list', 'Propiedades')

    const entity = store.resources()[0].name
    store.updateField(entity, 0, { type: 'enum' })

    const field = store.resources()[0].fields[0]
    expect(field.type).toBe('enum')
    expect(field.values?.length).toBeGreaterThan(0)
  })

  it('los valores de un enum se editan sin tocar el resto del campo', () => {
    const store = new DesignStore()
    store.addPage('list', 'Propiedades')
    const entity = store.resources()[0].name
    store.updateField(entity, 0, { type: 'enum' })

    store.updateField(entity, 0, {
      values: [
        { value: 'disponible', label: 'Disponible' },
        { value: 'vendida', label: 'Vendida' }
      ]
    })

    const field = store.resources()[0].fields[0]
    expect(field.values).toEqual([
      { value: 'disponible', label: 'Disponible' },
      { value: 'vendida', label: 'Vendida' }
    ])
    expect(field.label).toBe('Nombre')
  })

  it('al dejar de ser enum se olvidan los valores: no quedan colgando en el schema', () => {
    const store = new DesignStore()
    store.addPage('list', 'Propiedades')
    const entity = store.resources()[0].name
    store.updateField(entity, 0, { type: 'enum' })

    store.updateField(entity, 0, { type: 'string' })

    expect(store.resources()[0].fields[0].values).toBeUndefined()
  })
})

describe('DesignStore.addRelation — la flecha del diagrama es un campo ref real', () => {
  const storeWith = (...labels: string[]): DesignStore => {
    const store = new DesignStore()
    for (const label of labels) store.addResource(label)
    return store
  }

  it('añade al origen un campo ref con nombre y label derivados del destino', () => {
    const store = storeWith('Cita', 'Paciente')

    const ok = store.addRelation('cita', 'paciente')

    expect(ok).toBe(true)
    expect(store.resources().find(r => r.name === 'cita')?.fields.at(-1)).toEqual({
      name: 'paciente',
      label: 'Paciente',
      type: 'ref',
      refTo: 'paciente'
    })
  })

  it('la relación creada llega al resource-schema como par canónico id + nombre', () => {
    const store = storeWith('Cita', 'Paciente')

    store.addRelation('cita', 'paciente')

    const cita = store.registry()['cita']
    expect(cita.fields['pacienteId'].relation).toMatchObject({ to: 'paciente', kind: 'reference' })
    expect(cita.fields['pacienteName']).toBeDefined()
  })

  it('una segunda relación al mismo destino no pisa la primera: sufija el nombre', () => {
    const store = storeWith('Cita', 'Paciente')
    store.addRelation('cita', 'paciente')

    const ok = store.addRelation('cita', 'paciente')

    expect(ok).toBe(true)
    const names = store
      .resources()
      .find(r => r.name === 'cita')
      ?.fields.filter(f => f.type === 'ref')
      .map(f => f.name)
    expect(names).toEqual(['paciente', 'paciente2'])
  })

  it('rechaza la auto-referencia sin tocar el diseño', () => {
    const store = storeWith('Cita')

    const ok = store.addRelation('cita', 'cita')

    expect(ok).toBe(false)
    expect(store.lastError()).toBeTruthy()
    expect(store.resources()[0].fields.some(f => f.type === 'ref')).toBe(false)
  })

  it('removeRelation borra el campo ref (la flecha) y el schema deja de expandirlo', () => {
    const store = storeWith('Cita', 'Paciente')
    store.addRelation('cita', 'paciente')
    const index = store
      .resources()
      .find(r => r.name === 'cita')!
      .fields.findIndex(f => f.type === 'ref')

    const ok = store.removeRelation('cita', index)

    expect(ok).toBe(true)
    expect(store.resources().find(r => r.name === 'cita')?.fields.some(f => f.type === 'ref')).toBe(false)
    expect(store.registry()['cita'].fields['pacienteId']).toBeUndefined()
  })

  it('removeRelation NO borra un campo que no sea una relación', () => {
    const store = storeWith('Cita')

    const ok = store.removeRelation('cita', 0)

    expect(ok).toBe(false)
    expect(store.resources()[0].fields).toHaveLength(1)
  })

  it('rechaza relaciones con entidades que no existen', () => {
    const store = storeWith('Cita')

    expect(store.addRelation('cita', 'fantasma')).toBe(false)
    expect(store.addRelation('fantasma', 'cita')).toBe(false)
    expect(store.lastError()).toBeTruthy()
  })
})

describe('etiquetas de tipo de columna', () => {
  it('cada tipo del contrato tiene su etiqueta: un tipo nuevo no puede salir en blanco', async () => {
    // el editor vive en el componente, pero la regla es del contrato: si mañana se
    // añade un tipo y nadie le pone nombre, el desplegable aparecía vacío sin avisar
    const { TYPE_LABELS } = await import('./field-type-labels')

    for (const type of DRAFT_FIELD_TYPES) {
      expect(TYPE_LABELS[type]).toBeTruthy()
    }
  })
})

describe('mover y duplicar columnas (el orden viaja al código emitido)', () => {
  const conCampos = (): DesignStore => {
    const store = new DesignStore()
    store.addResource('Producto')
    store.addField('producto') // campo2
    store.addField('producto') // campo3
    return store
  }

  it('mover una columna cambia su sitio: el orden es el de las pantallas generadas', () => {
    const store = conCampos()
    const antes = store.resources()[0].fields.map(f => f.name)

    expect(store.moveField('producto', 2, 0)).toBe(true)
    expect(store.resources()[0].fields.map(f => f.name)).toEqual([antes[2], antes[0], antes[1]])
  })

  it('no mueve a un hueco que no existe', () => {
    const store = conCampos()
    const antes = store.resources()[0].fields.map(f => f.name)

    expect(store.moveField('producto', 0, 9)).toBe(false)
    expect(store.moveField('producto', -1, 0)).toBe(false)
    expect(store.resources()[0].fields.map(f => f.name)).toEqual(antes)
  })

  it('duplicar deja la copia justo detrás, con nombre libre y el mismo tipo', () => {
    const store = conCampos()
    store.updateField('producto', 0, { type: 'date' })

    expect(store.duplicateField('producto', 0)).toBe(true)

    const fields = store.resources()[0].fields
    expect(fields[1].name).not.toBe(fields[0].name)
    expect(fields[1].type).toBe('date')
    expect(new Set(fields.map(f => f.name)).size).toBe(fields.length)
  })

  it('duplicar una relación no crea una flecha gemela: el ref se copia como texto', () => {
    const store = conCampos()
    store.addResource('Proveedor')
    store.addRelation('producto', 'proveedor')
    const refIndex = store.resources()[0].fields.findIndex(f => f.type === 'ref')

    expect(store.duplicateField('producto', refIndex)).toBe(true)

    const refs = store.resources()[0].fields.filter(f => f.type === 'ref')
    expect(refs).toHaveLength(1)
  })

  it('sobre una entidad o un índice que no existen, no hace nada', () => {
    const store = conCampos()

    expect(store.duplicateField('fantasma', 0)).toBe(false)
    expect(store.duplicateField('producto', 9)).toBe(false)
    expect(store.moveField('fantasma', 0, 1)).toBe(false)
  })
})

describe('la referencia de un campo se elige aparte del tipo', () => {
  const conDos = (): DesignStore => {
    const store = new DesignStore()
    store.addResource('Producto')
    store.addResource('Proveedor')
    store.addField('producto')
    return store
  }

  it('apuntar un campo a otra entidad lo convierte en relación', () => {
    const store = conDos()

    expect(store.setFieldRef('producto', 1, 'proveedor')).toBe(true)

    const field = store.resources()[0].fields[1]
    expect(field.type).toBe('ref')
    expect(field.refTo).toBe('proveedor')
  })

  it('quitar la referencia deja un campo normal, sin destino colgando', () => {
    const store = conDos()
    store.setFieldRef('producto', 1, 'proveedor')

    expect(store.setFieldRef('producto', 1, null)).toBe(true)

    const field = store.resources()[0].fields[1]
    expect(field.type).not.toBe('ref')
    expect(field.refTo).toBeUndefined()
  })

  it('una entidad no puede apuntarse a sí misma', () => {
    const store = conDos()

    expect(store.setFieldRef('producto', 1, 'producto')).toBe(false)
    expect(store.lastError()).toBeTruthy()
  })

  it('no se puede apuntar a una entidad que no existe', () => {
    const store = conDos()

    expect(store.setFieldRef('producto', 1, 'fantasma')).toBe(false)
  })
})

describe('insertar un paso EN MEDIO de un tramo (el «+» de la referencia)', () => {
  const conTramo = (): DesignStore => {
    const store = new DesignStore()
    store.addFlow('Aviso')
    return store
  }

  it('parte el tramo en dos: inicio → nuevo → fin', () => {
    const store = conTramo()

    expect(store.insertFlowStep('Aviso', 'inicio', 'fin', 'Avisar a compras')).toBe(true)

    const flow = store.flows()[0]
    const nuevo = flow.nodes.find(n => n.text === 'Avisar a compras')
    expect(nuevo?.kind).toBe('step')
    expect(flow.edges).toEqual([
      { from: 'inicio', to: nuevo?.id },
      { from: nuevo?.id, to: 'fin' }
    ])
  })

  it('conserva la etiqueta del tramo en la primera mitad: la rama sigue siendo la que era', () => {
    const store = conTramo()
    store.addFlowNode('Aviso', 'decision', '¿Menos de 10?')
    store.addFlowEdge('Aviso', 'menos-de-10', 'fin', 'sí')

    store.insertFlowStep('Aviso', 'menos-de-10', 'fin', 'Avisar', 'sí')

    const flow = store.flows()[0]
    const nuevo = flow.nodes.find(n => n.text === 'Avisar')
    expect(flow.edges).toContainEqual({ from: 'menos-de-10', to: nuevo?.id, label: 'sí' })
    expect(flow.edges).toContainEqual({ from: nuevo?.id, to: 'fin' })
  })

  it('sobre un tramo que no existe no hace nada', () => {
    const store = conTramo()

    expect(store.insertFlowStep('Aviso', 'inicio', 'fantasma', 'Paso')).toBe(false)
    expect(store.flows()[0].nodes).toHaveLength(2)
  })
})
