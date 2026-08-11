import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

// Flujos de negocio en el store (spec 28, TASK-03). El store es PERMISIVO
// (gate ligero: identidad, referencias, topes) para permitir la edición
// incremental; la forma completa (aridad, alcanzabilidad) se exige en la
// frontera, como con DraftResource.

const withFlow = (): DesignStore => {
  const store = new DesignStore()
  store.addFlow('Alta de pedido')
  return store
}

describe('DesignStore — flujos: crear, renombrar, borrar', () => {
  it('arranca sin flujos', () => {
    expect(new DesignStore().flows()).toEqual([])
  })

  it('addFlow crea un flujo mínimo ya válido: inicio conectado a fin', () => {
    const store = withFlow()

    expect(store.flows()).toEqual([
      {
        name: 'Alta de pedido',
        nodes: [
          { id: 'inicio', kind: 'start', text: 'Inicio' },
          { id: 'fin', kind: 'end', text: 'Fin' }
        ],
        edges: [{ from: 'inicio', to: 'fin' }]
      }
    ])
  })

  it('rechaza un nombre de flujo duplicado y deja el error a mano', () => {
    const store = withFlow()

    expect(store.addFlow('Alta de pedido')).toBe(false)
    expect(store.flows()).toHaveLength(1)
    expect(store.lastError()).toMatch(/Alta de pedido/)
  })

  it('renameFlow cambia el nombre; a un duplicado, lo rechaza', () => {
    const store = withFlow()
    store.addFlow('Devolución')

    expect(store.renameFlow('Devolución', 'Reembolso')).toBe(true)
    expect(store.flows().map(f => f.name)).toEqual(['Alta de pedido', 'Reembolso'])
    expect(store.renameFlow('Reembolso', 'Alta de pedido')).toBe(false)
  })

  it('removeFlow lo quita entero', () => {
    const store = withFlow()

    expect(store.removeFlow('Alta de pedido')).toBe(true)
    expect(store.flows()).toEqual([])
  })
})

describe('DesignStore — nodos de flujo', () => {
  it('addFlowNode crea el nodo con id derivado del texto (slug sin acentos)', () => {
    const store = withFlow()

    expect(store.addFlowNode('Alta de pedido', 'step', '¿Reservar depósito?')).toBe(true)

    const nodes = store.flows()[0].nodes
    expect(nodes[2]).toEqual({ id: 'reservar-deposito', kind: 'step', text: '¿Reservar depósito?' })
  })

  it('un nodo suelto es legal mientras se dibuja: el store no exige aridad', () => {
    const store = withFlow()

    store.addFlowNode('Alta de pedido', 'decision', '¿hay stock?')

    expect(store.flows()[0].nodes).toHaveLength(3)
    expect(store.lastError()).toBeNull()
  })

  it('dos textos que colisionan en id: el segundo se sufija', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Revisar')

    store.addFlowNode('Alta de pedido', 'step', 'revisar')

    expect(store.flows()[0].nodes.map(n => n.id)).toContain('revisar-2')
  })

  it('updateFlowNode cambia texto, tipo o entidad sin tocar el id', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Reservar')

    expect(store.updateFlowNode('Alta de pedido', 'reservar', { text: 'Reservar stock', entity: 'producto' })).toBe(
      true
    )

    const node = store.flows()[0].nodes.find(n => n.id === 'reservar')
    expect(node).toEqual({ id: 'reservar', kind: 'step', text: 'Reservar stock', entity: 'producto' })
  })

  it('removeFlowNode arrastra sus aristas: nada queda apuntando al nodo borrado', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Revisar')
    store.addFlowEdge('Alta de pedido', 'inicio', 'revisar')
    store.addFlowEdge('Alta de pedido', 'revisar', 'fin')

    expect(store.removeFlowNode('Alta de pedido', 'revisar')).toBe(true)

    const flow = store.flows()[0]
    expect(flow.nodes.map(n => n.id)).toEqual(['inicio', 'fin'])
    expect(flow.edges.every(e => e.from !== 'revisar' && e.to !== 'revisar')).toBe(true)
  })

  it('removeFlowNode RECOSE la cadena: quien le apuntaba pasa a apuntar a quien le seguía', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Revisar')
    store.addFlowEdge('Alta de pedido', 'inicio', 'revisar')
    store.addFlowEdge('Alta de pedido', 'revisar', 'fin')
    store.removeFlowEdge('Alta de pedido', 'inicio', 'fin')

    expect(store.removeFlowNode('Alta de pedido', 'revisar')).toBe(true)

    // sin recosido el 'fin' quedaría huérfano y el layout lo mandaría a la capa de los inalcanzables
    expect(store.flows()[0].edges).toEqual([{ from: 'inicio', to: 'fin' }])
  })

  it('el recosido conserva la etiqueta de ENTRADA: el tramo sigue siendo de la misma rama', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'decision', '¿hay stock?')
    store.addFlowNode('Alta de pedido', 'step', 'Reservar')
    store.addFlowEdge('Alta de pedido', 'hay-stock', 'reservar', 'sí')
    store.addFlowEdge('Alta de pedido', 'reservar', 'fin')

    expect(store.removeFlowNode('Alta de pedido', 'reservar')).toBe(true)

    expect(store.flows()[0].edges).toContainEqual({ from: 'hay-stock', to: 'fin', label: 'sí' })
  })

  it('el recosido no inventa bucles ni tramos repetidos', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Revisar')
    store.addFlowEdge('Alta de pedido', 'inicio', 'revisar')
    store.addFlowEdge('Alta de pedido', 'revisar', 'fin')
    // 'inicio → fin' ya existe (lo trae addFlow), así que el recosido no debe duplicarlo
    expect(store.removeFlowNode('Alta de pedido', 'revisar')).toBe(true)

    expect(store.flows()[0].edges).toEqual([{ from: 'inicio', to: 'fin' }])
  })

  it('un nodo sin salida se borra sin más: no hay nada que recoser', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Suelto')
    store.addFlowEdge('Alta de pedido', 'inicio', 'suelto')

    expect(store.removeFlowNode('Alta de pedido', 'suelto')).toBe(true)

    expect(store.flows()[0].edges).toEqual([{ from: 'inicio', to: 'fin' }])
  })

  it('appendFlowStep cuelga la acción DETRÁS de otra sin romper la cadena', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Revisar')
    store.addFlowEdge('Alta de pedido', 'inicio', 'revisar')
    store.addFlowEdge('Alta de pedido', 'revisar', 'fin')
    store.removeFlowEdge('Alta de pedido', 'inicio', 'fin')

    expect(store.appendFlowStep('Alta de pedido', 'revisar', 'Aprobar')).toBe(true)

    const flow = store.flows()[0]
    expect(flow.nodes.map(n => n.id)).toEqual(['inicio', 'fin', 'revisar', 'aprobar'])
    expect(flow.edges).toEqual([
      { from: 'inicio', to: 'revisar' },
      { from: 'revisar', to: 'aprobar' },
      { from: 'aprobar', to: 'fin' }
    ])
  })

  it('appendFlowStep tras un paso sin salida solo añade el tramo nuevo', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'step', 'Revisar')
    store.addFlowEdge('Alta de pedido', 'inicio', 'revisar')

    expect(store.appendFlowStep('Alta de pedido', 'revisar', 'Aprobar')).toBe(true)

    expect(store.flows()[0].edges).toContainEqual({ from: 'revisar', to: 'aprobar' })
  })

  it('appendFlowStep no cuelga nada de un nodo que no existe', () => {
    const store = withFlow()

    expect(store.appendFlowStep('Alta de pedido', 'fantasma', 'Aprobar')).toBe(false)
    expect(store.flows()[0].nodes).toHaveLength(2)
  })

  it('rechaza un texto de nodo que supera el tope del contrato', () => {
    const store = withFlow()

    expect(store.addFlowNode('Alta de pedido', 'step', 'x'.repeat(121))).toBe(false)
    expect(store.flows()[0].nodes).toHaveLength(2)
  })
})

describe('DesignStore — aristas de flujo', () => {
  it('addFlowEdge conecta dos nodos; con etiqueta si se da', () => {
    const store = withFlow()
    store.addFlowNode('Alta de pedido', 'decision', '¿hay stock?')

    expect(store.addFlowEdge('Alta de pedido', 'hay-stock', 'fin', 'sí')).toBe(true)
    expect(store.flows()[0].edges).toContainEqual({ from: 'hay-stock', to: 'fin', label: 'sí' })
  })

  it('rechaza el auto-bucle y la arista hacia un nodo inexistente', () => {
    const store = withFlow()

    expect(store.addFlowEdge('Alta de pedido', 'inicio', 'inicio')).toBe(false)
    expect(store.addFlowEdge('Alta de pedido', 'inicio', 'fantasma')).toBe(false)
    expect(store.flows()[0].edges).toHaveLength(1)
  })

  it('rechaza la arista duplicada (mismo origen, destino y etiqueta)', () => {
    const store = withFlow()

    expect(store.addFlowEdge('Alta de pedido', 'inicio', 'fin')).toBe(false)
  })

  it('removeFlowEdge quita exactamente esa arista', () => {
    const store = withFlow()

    expect(store.removeFlowEdge('Alta de pedido', 'inicio', 'fin')).toBe(true)
    expect(store.flows()[0].edges).toEqual([])
  })
})

describe('DesignStore — los flujos viajan con el diseño', () => {
  it('exportJson y toAppSchema llevan los flujos', () => {
    const store = withFlow()
    store.addPage('list', 'Pedidos')

    expect(store.toAppSchema().flows).toHaveLength(1)
    expect(JSON.parse(store.exportJson()).flows[0].name).toBe('Alta de pedido')
  })

  it('sin flujos, el app-schema no declara la clave (los diseños viejos no cambian)', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')

    expect('flows' in store.toAppSchema()).toBe(false)
  })

  it('applyExternal restaura los flujos (persistencia y chat)', () => {
    const store = withFlow()
    const design = { appName: 'tienda', resources: [], pages: [], flows: store.flows() }

    const other = new DesignStore()
    expect(other.applyExternal(design)).toBe(true)
    expect(other.flows()).toEqual(store.flows())
  })

  it('applyExternal sin flujos los deja vacíos', () => {
    const store = withFlow()

    expect(store.applyExternal({ appName: 'tienda', resources: [], pages: [] })).toBe(true)
    expect(store.flows()).toEqual([])
  })

  it('una mutación de flujo inválida no toca nada: el store revierte entero', () => {
    const store = withFlow()
    const before = store.flows()

    store.addFlowEdge('Alta de pedido', 'inicio', 'fin')

    expect(store.flows()).toEqual(before)
  })
})
