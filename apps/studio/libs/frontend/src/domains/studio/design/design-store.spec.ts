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

  it('soltar KPIs donde ya hay crea OTRA fila: las filas conviven y se combinan por celdas (spec 73)', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas') // deja kpis:[counter venta] + table:venta

    const added = store.addBlock(0, { kind: 'kpis', items: [] })

    expect(added).toBe(true)
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['kpis', 'table', 'kpis'])
    expect(store.pages()[0].blocks[2].items).toEqual([])
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

  // spec 48: el bloque formulario enciende la bandera y viaja como página form
  it('el formulario es generable: marca la entidad y viaja al app-schema como página form', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Solicitud')
    store.addBlock(1, { kind: 'form', resource: 'pedido' })

    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource', 'form'])
    expect(store.resources()[0].form).toBe(true)
    expect(store.notGenerable()).toEqual([])
  })

  it('quitar el bloque formulario apaga la bandera de la entidad', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Solicitud')
    store.addBlock(1, { kind: 'form', resource: 'pedido' })

    store.removeBlock(1, 0)

    expect(store.resources()[0].form).toBe(false)
    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource'])
  })

  it('el export expande la bandera form al resource-schema', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addBlock(0, { kind: 'form', resource: 'pedido' })

    const exported = JSON.parse(store.exportJson()) as { resources: { form?: unknown }[] }

    expect(exported.resources[0].form).toEqual({})
  })

  it('una vista con solo KPIs se exporta como dashboard', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Resumen')
    store.addBlock(1, { kind: 'kpis', items: [{ kind: 'counter', resource: 'pedido' }] })

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

  it('un bloque de ficha cae DONDE se suelta, aunque la vista no sea una ficha', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')

    store.addBlock(0, { kind: 'fields', resource: 'paciente' })
    store.addBlock(0, { kind: 'attachments', resource: 'paciente' })

    expect(store.pages()).toHaveLength(1)
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['table', 'fields', 'attachments'])
  })

  it('…y la entidad declara detalle y ficheros, que es lo que sí viaja al generador', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')

    store.addBlock(0, { kind: 'attachments', resource: 'paciente' })

    expect(store.resources()[0]).toMatchObject({ name: 'paciente', attachments: true })
  })

  it('fuera de una ficha, esos bloques son solo diseño: el generador no los emite ahí', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')
    store.addPage('detail', 'Paciente')

    store.addBlock(0, { kind: 'attachments', resource: 'paciente' })
    store.addBlock(1, { kind: 'attachments', resource: 'paciente' })

    // el del listado se reporta; el de la ficha, no: ahí sí se emite
    expect(store.notGenerable()).toEqual([{ page: 'Pacientes', blocks: ['attachments'] }])
  })

  it('la vista de ficha sigue sin ser navegación de primer nivel', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pacientes')
    store.addPage('detail', 'Paciente')

    expect(store.pages()[1].drillDown).toBe(true)
    expect(store.menuPages().map(p => p.title)).toEqual(['Pacientes'])
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
    expect(
      store
        .resources()
        .find(r => r.name === 'cita')
        ?.fields.at(-1)
    ).toEqual({
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
    expect(
      store
        .resources()
        .find(r => r.name === 'cita')
        ?.fields.some(f => f.type === 'ref')
    ).toBe(false)
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

  // ENCADENAR CONDICIONES: meter un rombo en medio de un tramo es el gesto natural
  // de «y si además…». El camino que ya existía sigue siendo el principal: la salida
  // de la condición nueva hacia el destino original nace etiquetada «sí», y la rama
  // «no» queda pendiente de dibujar (el gate de borrador lo permite).
  it('insertar una CONDICIÓN parte el tramo y el camino original sale por su «sí»', () => {
    const store = conTramo()

    expect(store.insertFlowNode('Aviso', 'inicio', 'fin', 'decision', '¿urgente?')).toBe(true)

    const flow = store.flows()[0]
    const nueva = flow.nodes.find(n => n.text === '¿urgente?')
    expect(nueva?.kind).toBe('decision')
    expect(flow.edges).toEqual([
      { from: 'inicio', to: nueva?.id },
      { from: nueva?.id, to: 'fin', label: 'sí' }
    ])
  })

  it('insertar una condición en una rama conserva la etiqueta de entrada', () => {
    const store = conTramo()
    store.addFlowNode('Aviso', 'decision', '¿Menos de 10?')
    store.addFlowEdge('Aviso', 'menos-de-10', 'fin', 'sí')

    store.insertFlowNode('Aviso', 'menos-de-10', 'fin', 'decision', '¿proveedor activo?', 'sí')

    const flow = store.flows()[0]
    const nueva = flow.nodes.find(n => n.text === '¿proveedor activo?')
    expect(flow.edges).toContainEqual({ from: 'menos-de-10', to: nueva?.id, label: 'sí' })
    expect(flow.edges).toContainEqual({ from: nueva?.id, to: 'fin', label: 'sí' })
  })

  // La etiqueta '' es el aviso del dominio de que «sí» y «no» ya están repartidos
  // (flowBranchLabel). Dejarla pasar acababa en «la etiqueta debe tener entre 1 y 20
  // caracteres»: un error críptico de un campo que el usuario nunca escribió.
  it('la tercera salida de una decisión se rechaza contando QUÉ pasa y QUÉ hacer', () => {
    const store = conTramo()
    store.addFlowNode('Aviso', 'decision', '¿Menos de 10?')
    store.addFlowNode('Aviso', 'step', 'Avisar')
    store.addFlowEdge('Aviso', 'menos-de-10', 'fin', 'sí')
    store.addFlowEdge('Aviso', 'menos-de-10', 'avisar', 'no')

    expect(store.addFlowEdge('Aviso', 'menos-de-10', 'avisar', '')).toBe(false)

    expect(store.lastError()).toContain('«sí» y «no»')
    expect(store.lastError()).toContain('borra una')
    // y el flujo no se ha tocado
    expect(store.flows()[0].edges.filter(e => e.from === 'menos-de-10')).toHaveLength(2)
  })
})

describe('reordenar las acciones de una tarjeta (spec 40)', () => {
  const conCadena = (): DesignStore => {
    const store = new DesignStore()
    store.addFlow('Aviso')
    store.addFlowNode('Aviso', 'step', 'Marcar la fila')
    store.addFlowNode('Aviso', 'step', 'Enviar correo')
    store.addFlowNode('Aviso', 'step', 'Cerrar el aviso')
    store.addFlowEdge('Aviso', 'inicio', 'marcar-la-fila')
    store.addFlowEdge('Aviso', 'marcar-la-fila', 'enviar-correo')
    store.addFlowEdge('Aviso', 'enviar-correo', 'cerrar-el-aviso')
    store.addFlowEdge('Aviso', 'cerrar-el-aviso', 'fin')
    store.removeFlowEdge('Aviso', 'inicio', 'fin')
    return store
  }

  it('mover una acción recablea la cadena del flujo guardado', () => {
    const store = conCadena()

    expect(store.reorderFlowStep('Aviso', 'cerrar-el-aviso', 0)).toBe(true)

    const flow = store.flows()[0]
    expect(flow.edges).toContainEqual({ from: 'inicio', to: 'cerrar-el-aviso' })
    expect(flow.edges).toContainEqual({ from: 'cerrar-el-aviso', to: 'marcar-la-fila' })
    expect(flow.edges).toContainEqual({ from: 'enviar-correo', to: 'fin' })
  })

  it('dejarla donde estaba no toca el flujo: ni una arista nueva', () => {
    const store = conCadena()
    const antes = store.flows()[0]

    expect(store.reorderFlowStep('Aviso', 'enviar-correo', 1)).toBe(true)
    // el MISMO objeto: sin objeto nuevo no hay guardado que hacer
    expect(store.flows()[0]).toBe(antes)
  })

  it('sobre un flujo que no existe no hace nada', () => {
    const store = conCadena()

    expect(store.reorderFlowStep('Fantasma', 'marcar-la-fila', 1)).toBe(false)
  })
})

/**
 * Spec 43: promover un enum a estado de la entidad. El store es la única puerta de
 * mutación y el gate de defineResource dispara en cada cambio, así que la máquina
 * jamás puede quedar hablando de un campo que ya no es enum: quien lo cambia, la tira.
 */
describe('la máquina de estados del recurso (spec 43)', () => {
  const setup = () => {
    const store = new DesignStore()
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    return store
  }

  it('promover un enum crea la máquina: ancla, inicial = primer valor, sin transiciones', () => {
    const store = setup()

    expect(store.promoteState('solicitud', 'nombre')).toBe(true)

    const machine = store.resources()[0].state
    expect(machine?.field).toBe('nombre')
    expect(machine?.initial).toBe(store.resources()[0].fields[0].values?.[0]?.value)
    expect(machine?.transitions).toEqual([])
  })

  it('un campo que no es enum no se puede promover, y el motivo queda dicho', () => {
    const store = setup()
    store.addField('solicitud')

    expect(store.promoteState('solicitud', 'campo2')).toBe(false)
    expect(store.lastError()).toMatch(/enum/)
  })

  it('despromover tira la máquina entera', () => {
    const store = setup()
    store.promoteState('solicitud', 'nombre')

    expect(store.demoteState('solicitud')).toBe(true)
    expect(store.resources()[0].state).toBeUndefined()
  })

  it('cambiar el tipo del campo ancla tira la máquina con él', () => {
    const store = setup()
    store.promoteState('solicitud', 'nombre')

    expect(store.updateField('solicitud', 0, { type: 'string' })).toBe(true)
    expect(store.resources()[0].state).toBeUndefined()
  })

  it('borrar el campo ancla tira la máquina con él', () => {
    const store = setup()
    store.promoteState('solicitud', 'nombre')

    expect(store.removeField('solicitud', 0)).toBe(true)
    expect(store.resources()[0].state).toBeUndefined()
  })
})

/**
 * Spec 43 (gestos): las transiciones se editan por el store, que agrupa por nombre —
 * dos flechas con el mismo verbo hacia el mismo destino son UNA transición con dos
 * orígenes. El gate de defineResource protege cada mutación (ancla, valores, nombres).
 */
describe('las transiciones de la máquina (spec 43)', () => {
  const setup = () => {
    const store = new DesignStore()
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    store.promoteState('solicitud', 'nombre')
    return store
  }

  const machineOf = (store: DesignStore) => store.resources()[0].state
  /** El verbo propuesto siempre es kebab, aunque el valor del enum sea snake. */
  const verb = (to: string) => `a-${to.replace(/_/g, '-')}`

  it('arrastrar crea la transición con nombre propuesto a-<destino>', () => {
    const store = setup()
    const [a, b] = store.resources()[0].fields[0].values!.map(v => v.value)

    expect(store.addTransition('solicitud', a, b)).toBe(true)

    const machine = machineOf(store)
    expect(machine?.transitions).toHaveLength(1)
    expect(machine?.transitions[0].name).toBe(verb(b))
    expect(machine?.transitions[0].from).toEqual([a])
    expect(machine?.transitions[0].to).toBe(b)
    expect(machine?.transitions[0].label.length).toBeGreaterThan(0)
  })

  it('una segunda flecha del mismo verbo al mismo destino se agrupa: un solo from con dos orígenes', () => {
    const store = setup()
    const [a, b, c] = store.resources()[0].fields[0].values!.map(v => v.value)
    store.addTransition('solicitud', a, c)

    expect(store.addTransition('solicitud', b, c)).toBe(true)

    const machine = machineOf(store)
    expect(machine?.transitions).toHaveLength(1)
    expect(machine?.transitions[0].from).toEqual([a, b])
  })

  it('una flecha de un valor a sí mismo no pasa el gate y no deja rastro', () => {
    const store = setup()
    const [a] = store.resources()[0].fields[0].values!.map(v => v.value)

    expect(store.addTransition('solicitud', a, a)).toBe(false)
    expect(machineOf(store)?.transitions).toEqual([])
  })

  it('renombrar cambia verbo y label; un nombre duplicado hacia otro destino se rechaza', () => {
    const store = setup()
    const [a, b, c] = store.resources()[0].fields[0].values!.map(v => v.value)
    store.addTransition('solicitud', a, b)
    store.addTransition('solicitud', a, c)

    expect(store.updateTransition('solicitud', verb(b), { name: 'aprobar', label: 'Aprobar' })).toBe(true)
    expect(machineOf(store)?.transitions[0]).toMatchObject({ name: 'aprobar', label: 'Aprobar' })

    expect(store.updateTransition('solicitud', 'aprobar', { name: verb(c) })).toBe(false)
    expect(machineOf(store)?.transitions[0].name).toBe('aprobar')
  })

  it('borrar una flecha quita ese origen; la última se lleva la transición entera', () => {
    const store = setup()
    const [a, b, c] = store.resources()[0].fields[0].values!.map(v => v.value)
    store.addTransition('solicitud', a, c)
    store.addTransition('solicitud', b, c)

    expect(store.removeTransition('solicitud', verb(c), a)).toBe(true)
    expect(machineOf(store)?.transitions[0].from).toEqual([b])

    expect(store.removeTransition('solicitud', verb(c), b)).toBe(true)
    expect(machineOf(store)?.transitions).toEqual([])
  })

  // La curación de la ficha (spec 74): ocultar el botón y reordenarlos. El endpoint no cambia.
  it('ocultar marca hidden y volver a mostrar lo quita del todo (sin hidden: false residual)', () => {
    const store = setup()
    const [a, b] = store.resources()[0].fields[0].values!.map(v => v.value)
    store.addTransition('solicitud', a, b)

    expect(store.setTransitionHidden('solicitud', verb(b), true)).toBe(true)
    expect(machineOf(store)?.transitions[0].hidden).toBe(true)

    expect(store.setTransitionHidden('solicitud', verb(b), false)).toBe(true)
    expect('hidden' in machineOf(store)!.transitions[0]).toBe(false)
  })

  it('mover reordena el array (el orden ES el de los botones emitidos) y respeta los bordes', () => {
    const store = setup()
    const [a, b, c] = store.resources()[0].fields[0].values!.map(v => v.value)
    store.addTransition('solicitud', a, b)
    store.addTransition('solicitud', a, c)

    expect(store.moveTransition('solicitud', verb(c), -1)).toBe(true)
    expect(machineOf(store)?.transitions.map(t => t.name)).toEqual([verb(c), verb(b)])

    // ya está la primera: subir otra vez no hace nada y no rompe
    expect(store.moveTransition('solicitud', verb(c), -1)).toBe(false)
    expect(machineOf(store)?.transitions.map(t => t.name)).toEqual([verb(c), verb(b)])

    expect(store.moveTransition('solicitud', verb(c), 1)).toBe(true)
    expect(machineOf(store)?.transitions.map(t => t.name)).toEqual([verb(b), verb(c)])
  })

  it('cambiar el estado inicial se aplica; un valor ajeno al enum no pasa el gate', () => {
    const store = setup()
    const [, b] = store.resources()[0].fields[0].values!.map(v => v.value)

    expect(store.setInitialState('solicitud', b)).toBe(true)
    expect(machineOf(store)?.initial).toBe(b)

    expect(store.setInitialState('solicitud', 'limbo')).toBe(false)
    expect(machineOf(store)?.initial).toBe(b)
  })
})

/**
 * Spec 74 (coherencia flag↔página): el generador emite la ficha desde la bandera `detail`
 * de la entidad, pero el estudio solo dibuja PÁGINAS — si nadie añadió la vista, los
 * botones existen en el emitido y no tienen representación (caso ofertas de inmobiliaria).
 * Este gesto crea la ficha de una entidad EXISTENTE, cosa que addPage no sabe hacer.
 */
describe('DesignStore.addDetailPageFor — la ficha de una entidad existente', () => {
  it('crea la página con fields (+adjuntos si la entidad los declara), drillDown y la bandera detail', () => {
    const store = new DesignStore()
    store.addResource('Oferta')

    expect(store.addDetailPageFor('oferta')).toBe(true)

    const page = store.pages().at(-1)!
    expect(page.blocks.map(b => b.kind)).toEqual(['fields'])
    expect(page.drillDown).toBe(true)
    expect(page.title.toLowerCase()).toContain('ficha')
    expect(store.resources()[0].detail).toBe(true)
  })

  it('si ya hay una página de ficha para la entidad, no duplica y explica el error', () => {
    const store = new DesignStore()
    store.addResource('Oferta')
    store.addDetailPageFor('oferta')

    expect(store.addDetailPageFor('oferta')).toBe(false)
    expect(store.lastError()).toContain('ficha')
    expect(store.pages().filter(p => p.blocks.some(b => b.kind === 'fields')).length).toBe(1)
  })

  it('una entidad desconocida no pasa', () => {
    const store = new DesignStore()
    expect(store.addDetailPageFor('fantasma')).toBe(false)
  })
})

describe('DesignStore — puertos locales', () => {
  it('conserva los puertos de un diseño aplicado desde fuera', () => {
    const store = new DesignStore()

    const ok = store.applyExternal({
      appName: 'taller',
      resources: [],
      pages: [],
      ports: { api: 3010, web: 4321, postgres: 5443, postgresTest: 5444 }
    })

    expect(ok).toBe(true)
    expect(store.ports()).toEqual({ api: 3010, web: 4321, postgres: 5443, postgresTest: 5444 })
  })

  it('un diseño sin puertos los deja sin declarar, y setPorts los cambia', () => {
    const store = new DesignStore()

    store.applyExternal({ appName: 'taller', resources: [], pages: [] })
    expect(store.ports()).toBeUndefined()

    store.setPorts({ api: 3010 })
    expect(store.ports()).toEqual({ api: 3010 })

    store.setPorts(undefined)
    expect(store.ports()).toBeUndefined()
  })

  it('removeResource borra una entidad suelta del modelo', () => {
    const store = new DesignStore()
    store.addResource('Cliente')

    const ok = store.removeResource('cliente')

    expect(ok).toBe(true)
    expect(store.resources()).toEqual([])
  })

  it('removeResource tira también la vista que se queda vacía sin sus bloques', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')

    const ok = store.removeResource('pedido')

    expect(ok).toBe(true)
    expect(store.resources()).toEqual([])
    expect(store.pages()).toEqual([])
  })

  it('removeResource respeta la vista con más contenido: pierde los bloques y sigue', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addBlock(0, { kind: 'text', text: 'Aviso para el equipo' })

    const ok = store.removeResource('pedido')

    expect(ok).toBe(true)
    expect(store.pages()[0].title).toBe('Pedidos')
    expect(store.pages()[0].blocks.map(b => b.kind)).toEqual(['text'])
  })

  it('removeResource no toca una vista que ya estaba vacía antes', () => {
    const store = new DesignStore()
    store.addPage('blank', 'Notas')
    store.addResource('Cliente')

    const ok = store.removeResource('cliente')

    expect(ok).toBe(true)
    expect(store.pages()).toEqual([{ title: 'Notas', blocks: [] }])
  })

  it('removeResource quita sus celdas de la fila sin tumbar el bloque', () => {
    const store = new DesignStore()
    store.addPage('panel', 'Ventas') // kpis:[counter venta] + table:venta
    store.addResource('Cliente')
    store.addCell(0, 0, 'counter', 'cliente')

    const ok = store.removeResource('venta')

    expect(ok).toBe(true)
    expect(store.resources().map(r => r.name)).toEqual(['cliente'])
    // la tabla de venta cae; la fila sobrevive midiendo solo a cliente
    expect(store.pages()[0].blocks).toEqual([
      { kind: 'kpis', items: [{ kind: 'counter', resource: 'cliente' }], width: 'full' }
    ])
  })

  it('removeResource borra también las relaciones entrantes de otras entidades', () => {
    const store = new DesignStore()
    store.addResource('Cliente')
    store.addResource('Pedido')
    store.addRelation('pedido', 'cliente')

    const ok = store.removeResource('cliente')

    expect(ok).toBe(true)
    expect(store.resources().map(r => r.name)).toEqual(['pedido'])
    const pedido = store.resources()[0]
    expect(pedido.fields.some(f => f.type === 'ref')).toBe(false)
  })

  it('removeResource sobre una entidad inexistente no toca nada y lo dice', () => {
    const store = new DesignStore()
    store.addResource('Cliente')

    const ok = store.removeResource('fantasma')

    expect(ok).toBe(false)
    expect(store.resources().map(r => r.name)).toEqual(['cliente'])
    expect(store.lastError()).toContain('fantasma')
  })
})
