import { describe, expect, it } from 'vitest'
import type { BusinessFlow } from '@acc/schema'
import { FLOW_GROUP, flowCondensed, flowGroupBox, flowGroups } from './flow-groups'
import { FLOW_GRID, flowLayout } from './flow-diagram'

// Las acciones consecutivas de una rama se leen como UNA tarjeta con filas numeradas
// (referencia 12A: «RAMA SÍ · 1 Marcar la fila · 2 Enviar correo · + Acción»). El grupo
// NO existe en el contrato: se deduce del grafo al dibujar.

const conRamas = (): BusinessFlow => ({
  name: 'Cambia el stock',
  nodes: [
    { id: 'disparador', kind: 'start', text: 'Cambia el stock' },
    { id: 'bajo', kind: 'decision', text: 'stock < 10' },
    { id: 'marcar', kind: 'step', text: 'Marcar la fila en naranja' },
    { id: 'correo', kind: 'step', text: 'Enviar correo' },
    { id: 'quitar', kind: 'step', text: 'Quitar el aviso' },
    { id: 'fin', kind: 'end', text: 'Listo' }
  ],
  edges: [
    { from: 'disparador', to: 'bajo' },
    { from: 'bajo', to: 'marcar', label: 'sí' },
    { from: 'marcar', to: 'correo' },
    { from: 'correo', to: 'fin' },
    { from: 'bajo', to: 'quitar', label: 'no' },
    { from: 'quitar', to: 'fin' }
  ]
})

describe('flowGroups — cadenas de acciones consecutivas', () => {
  it('agrupa los pasos que van uno detrás de otro en una sola tarjeta', () => {
    const groups = flowGroups(conRamas())

    expect(groups.map(g => g.steps.map(s => s.id))).toEqual([['marcar', 'correo'], ['quitar']])
  })

  it('la tarjeta se llama por la rama de la que cuelga: RAMA SÍ / RAMA NO', () => {
    const groups = flowGroups(conRamas())

    expect(groups.map(g => g.branch)).toEqual(['sí', 'no'])
  })

  it('el id del grupo es el de su primer paso: es quien lo representa en el lienzo', () => {
    expect(flowGroups(conRamas()).map(g => g.id)).toEqual(['marcar', 'quitar'])
  })

  it('un paso al que apuntan DOS sitios rompe la cadena: es un punto de encuentro', () => {
    const flow = conRamas()
    // 'correo' pasa a recibir también del 'no': ya no es la continuación de 'marcar'
    flow.edges = [...flow.edges, { from: 'quitar', to: 'correo' }]

    const groups = flowGroups(flow)

    // manda el orden de los nodos del flujo: marcar, correo, quitar
    expect(groups.map(g => g.steps.map(s => s.id))).toEqual([['marcar'], ['correo'], ['quitar']])
  })

  it('un paso con DOS salidas cierra su tarjeta: lo que sigue son dos caminos, no una fila', () => {
    const flow = conRamas()
    flow.edges = [...flow.edges, { from: 'marcar', to: 'fin' }]

    const groups = flowGroups(flow)

    expect(groups.map(g => g.steps.map(s => s.id))).toEqual([['marcar'], ['correo'], ['quitar']])
  })

  it('un flujo sin pasos no tiene tarjetas', () => {
    const flow = conRamas()
    flow.nodes = flow.nodes.filter(n => n.kind !== 'step')
    flow.edges = [{ from: 'disparador', to: 'bajo' }]

    expect(flowGroups(flow)).toEqual([])
  })

  it('es determinista: manda el orden de los nodos del flujo', () => {
    expect(flowGroups(conRamas())).toEqual(flowGroups(conRamas()))
  })
})

describe('flowCondensed — el grafo que se dibuja', () => {
  it('sustituye cada cadena por su cabeza: las flechas internas desaparecen del lienzo', () => {
    const condensed = flowCondensed(conRamas())

    expect(condensed.nodes.map(n => n.id)).toEqual(['disparador', 'bajo', 'marcar', 'quitar', 'fin'])
    expect(condensed.edges).toEqual([
      { from: 'disparador', to: 'bajo' },
      { from: 'bajo', to: 'marcar', label: 'sí' },
      { from: 'marcar', to: 'fin' },
      { from: 'bajo', to: 'quitar', label: 'no' },
      { from: 'quitar', to: 'fin' }
    ])
  })

  it('un paso que se apunta a sí mismo no dibuja una flecha a la propia tarjeta', () => {
    const flow = conRamas()
    flow.edges = [...flow.edges, { from: 'quitar', to: 'quitar' }]

    const condensed = flowCondensed(flow)

    expect(condensed.edges.filter(e => e.from === e.to)).toEqual([])
  })
})

describe('flowLayout con tarjetas — la altura de la tarjeta no le cambia el sitio', () => {
  it('coloca la tarjeta en la columna que le toca, no en el origen', () => {
    const flow = conRamas()
    const groups = flowGroups(flow)
    const filas = new Map(groups.map(group => [group.id, group.steps.length]))

    const positions = flowLayout(flowCondensed(flow, groups), 'horizontal', {}, id => {
      const rows = filas.get(id)
      return rows === undefined ? undefined : flowGroupBox({ x: 0, y: 0 }, rows)
    })

    // 'marcar' cuelga de la decisión, que está en la capa 1: le toca la 2
    expect(positions['marcar'].x).toBe(FLOW_GRID.margin + 2 * FLOW_GRID.colWidth + (200 - FLOW_GROUP.width) / 2)
    expect(positions['marcar'].y).toBeLessThan(FLOW_GRID.margin + FLOW_GRID.rowHeight)
  })
})

describe('flowGroupBox — la tarjeta crece con sus filas', () => {
  it('cabecera + una fila por acción + el pie del «+ Acción»', () => {
    const [ramaSi] = flowGroups(conRamas())

    expect(flowGroupBox({ x: 10, y: 20 }, ramaSi.steps.length)).toEqual({
      x: 10,
      y: 20,
      width: FLOW_GROUP.width,
      height: FLOW_GROUP.headerHeight + 2 * FLOW_GROUP.rowHeight + FLOW_GROUP.footerHeight
    })
  })

  it('la tarjeta cabe en la celda de la rejilla: si no, las flechas se cruzan', () => {
    expect(FLOW_GROUP.width).toBeLessThan(FLOW_GRID.colWidth)
  })
})
