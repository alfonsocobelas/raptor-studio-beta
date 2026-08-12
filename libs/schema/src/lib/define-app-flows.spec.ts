import { defineApp } from './define-app'
import { AppDefinition, BusinessFlow, FlowEdge, FlowNode } from './app-types'
import { SchemaValidationError } from './validation-errors'

// Gate estructural de los flujos de negocio (spec 28). La existencia de
// `entity` NO se valida aquí: es cosa de la frontera, como widget.resource.

const validFlow = (over: Partial<BusinessFlow> = {}): BusinessFlow => ({
  name: 'Alta de pedido',
  nodes: [
    { id: 'inicio', kind: 'start', text: 'llega un pedido' },
    { id: 'stock', kind: 'decision', text: '¿hay stock?' },
    { id: 'reservar', kind: 'step', text: 'reservar stock', entity: 'producto' },
    { id: 'pedir', kind: 'step', text: 'pedir al proveedor' },
    { id: 'fin', kind: 'end', text: 'pedido tramitado' }
  ],
  edges: [
    { from: 'inicio', to: 'stock' },
    { from: 'stock', to: 'reservar', label: 'sí' },
    { from: 'stock', to: 'pedir', label: 'no' },
    { from: 'reservar', to: 'fin' },
    { from: 'pedir', to: 'fin' }
  ],
  ...over
})

const app = (...flows: BusinessFlow[]): AppDefinition => ({
  schemaVersion: 1,
  name: 'almacen',
  pages: [{ kind: 'resource', resource: 'pedido' }],
  flows
})

const problemsOf = (definition: AppDefinition): string[] => {
  try {
    defineApp(definition)
    return []
  } catch (e) {
    if (e instanceof SchemaValidationError) return e.problems
    throw e
  }
}

describe('defineApp — flujos de negocio (spec 28)', () => {
  describe('flujo válido', () => {
    it('acepta un flujo completo con decisión y dos ramas', () => {
      expect(problemsOf(app(validFlow()))).toEqual([])
    })

    it('sin flujos declarados no hay nada que validar', () => {
      const definition = app()
      delete definition.flows

      expect(problemsOf(definition)).toEqual([])
    })

    it('acepta un ciclo entre nodos distintos: los reintentos existen', () => {
      const flow = validFlow({
        nodes: [
          { id: 'inicio', kind: 'start', text: 'llega solicitud' },
          { id: 'revisar', kind: 'step', text: 'revisar documentación' },
          { id: 'valida', kind: 'decision', text: '¿documentación válida?' },
          { id: 'subsanar', kind: 'step', text: 'pedir subsanación' },
          { id: 'fin', kind: 'end', text: 'aprobada' }
        ],
        edges: [
          { from: 'inicio', to: 'revisar' },
          { from: 'revisar', to: 'valida' },
          { from: 'valida', to: 'fin', label: 'sí' },
          { from: 'valida', to: 'subsanar', label: 'no' },
          { from: 'subsanar', to: 'revisar' }
        ]
      })

      expect(problemsOf(app(flow))).toEqual([])
    })
  })

  describe('identidad de nodos y flujos', () => {
    it('rechaza ids de nodo duplicados dentro del flujo', () => {
      const nodes = validFlow().nodes.map(n => (n.id === 'pedir' ? { ...n, id: 'reservar' } : n))

      expect(problemsOf(app(validFlow({ nodes })))).toContain("flows[0]: duplicated node id 'reservar'")
    })

    it('rechaza un id de nodo que no sea kebab-case', () => {
      const nodes: FlowNode[] = [...validFlow().nodes]
      nodes[2] = { ...nodes[2], id: 'Reservar Stock' }

      expect(problemsOf(app(validFlow({ nodes })))).toContain('flows[0].nodes[2]: id must be non-empty kebab-case')
    })

    it('rechaza nombres de flujo duplicados en la app', () => {
      expect(problemsOf(app(validFlow(), validFlow()))).toContain("flows: duplicated flow name 'Alta de pedido'")
    })
  })

  describe('aristas', () => {
    it('rechaza una arista hacia un nodo inexistente', () => {
      const edges: FlowEdge[] = [...validFlow().edges, { from: 'fantasma', to: 'fin' }]

      expect(problemsOf(app(validFlow({ edges })))).toContain("flows[0].edges[5]: unknown node 'fantasma'")
    })

    it('rechaza aristas duplicadas (from + to + label)', () => {
      const edges: FlowEdge[] = [...validFlow().edges, { from: 'reservar', to: 'fin' }]

      expect(problemsOf(app(validFlow({ edges })))).toContain("flows[0]: duplicated edge from 'reservar' to 'fin'")
    })

    it('rechaza el auto-bucle', () => {
      const flow = validFlow()
      const edges: FlowEdge[] = flow.edges.map(e => (e.from === 'reservar' ? { from: 'reservar', to: 'reservar' } : e))

      expect(problemsOf(app(validFlow({ edges })))).toContain("flows[0].edges[3]: self-loop on 'reservar' is not allowed")
    })
  })

  describe('forma del proceso', () => {
    it('rechaza un flujo sin nodo start', () => {
      const nodes = validFlow().nodes.map(n => (n.kind === 'start' ? { ...n, kind: 'step' as const } : n))

      expect(problemsOf(app(validFlow({ nodes })))).toContain('flows[0]: exactly one start node is required (found 0)')
    })

    it('rechaza un flujo con dos start', () => {
      const flow = validFlow({
        nodes: [...validFlow().nodes, { id: 'otro-inicio', kind: 'start', text: 'otro arranque' }],
        edges: [...validFlow().edges, { from: 'otro-inicio', to: 'stock' }]
      })

      expect(problemsOf(app(flow))).toContain('flows[0]: exactly one start node is required (found 2)')
    })

    it('rechaza un flujo sin nodo end', () => {
      const nodes = validFlow().nodes.map(n => (n.kind === 'end' ? { ...n, kind: 'step' as const } : n))
      const edges: FlowEdge[] = [...validFlow().edges, { from: 'fin', to: 'reservar' }]

      expect(problemsOf(app(validFlow({ nodes, edges })))).toContain('flows[0]: at least one end node is required')
    })

    it('rechaza una decisión con menos de dos salidas', () => {
      const edges = validFlow().edges.filter(e => e.label !== 'no')
      const nodes = validFlow().nodes.filter(n => n.id !== 'pedir')

      expect(problemsOf(app(validFlow({ nodes, edges })))).toContain(
        "flows[0]: decision 'stock' requires at least 2 outgoing edges (found 1)"
      )
    })

    it('rechaza una salida de decisión sin etiqueta', () => {
      const edges = validFlow().edges.map(e => (e.label === 'no' ? { from: e.from, to: e.to } : e))

      expect(problemsOf(app(validFlow({ edges })))).toContain(
        "flows[0].edges[2]: edge from decision 'stock' requires a label"
      )
    })

    it('rechaza un step sin salida: un paso intermedio no puede ser un callejón', () => {
      const edges = validFlow().edges.filter(e => e.from !== 'pedir')

      expect(problemsOf(app(validFlow({ edges })))).toContain(
        "flows[0]: step 'pedir' requires exactly one outgoing edge (found 0)"
      )
    })

    it('rechaza un start con más de una salida', () => {
      const edges: FlowEdge[] = [...validFlow().edges, { from: 'inicio', to: 'pedir' }]

      expect(problemsOf(app(validFlow({ edges })))).toContain(
        "flows[0]: start 'inicio' requires exactly one outgoing edge (found 2)"
      )
    })

    it('rechaza un end con salidas', () => {
      const edges: FlowEdge[] = [...validFlow().edges, { from: 'fin', to: 'stock' }]

      expect(problemsOf(app(validFlow({ edges })))).toContain("flows[0]: end 'fin' must not have outgoing edges")
    })

    it('rechaza nodos inalcanzables desde el start', () => {
      const flow = validFlow({
        nodes: [
          ...validFlow().nodes,
          { id: 'isla', kind: 'step', text: 'nadie llega aquí' },
          { id: 'isla-fin', kind: 'end', text: 'fin aislado' }
        ],
        edges: [...validFlow().edges, { from: 'isla', to: 'isla-fin' }]
      })

      expect(problemsOf(app(flow))).toContain("flows[0]: node 'isla' is unreachable from the start")
    })
  })

  describe('topes (el diseño se reenvía en cada turno del chat)', () => {
    it('rechaza más de 10 flujos', () => {
      const flows = Array.from({ length: 11 }, (_, i) => validFlow({ name: `Flujo ${i}` }))

      expect(problemsOf(app(...flows))).toContain('flows: at most 10 flows are allowed (found 11)')
    })

    it('rechaza un flujo con nombre vacío o de más de 60 caracteres', () => {
      expect(problemsOf(app(validFlow({ name: '' })))).toContain('flows[0]: name must be 1-60 characters')
      expect(problemsOf(app(validFlow({ name: 'x'.repeat(61) })))).toContain('flows[0]: name must be 1-60 characters')
    })

    it('rechaza más de 30 nodos por flujo', () => {
      const chain: FlowNode[] = [
        { id: 'inicio', kind: 'start', text: 'arranca' },
        ...Array.from({ length: 29 }, (_, i): FlowNode => ({ id: `paso-${i}`, kind: 'step', text: `paso ${i}` })),
        { id: 'fin', kind: 'end', text: 'acaba' }
      ]
      const edges: FlowEdge[] = chain.slice(0, -1).map((n, i) => ({ from: n.id, to: chain[i + 1].id }))

      expect(problemsOf(app(validFlow({ nodes: chain, edges })))).toContain(
        'flows[0]: at most 30 nodes are allowed (found 31)'
      )
    })

    it('rechaza más de 60 aristas por flujo', () => {
      const edges: FlowEdge[] = [
        ...validFlow().edges,
        ...Array.from({ length: 56 }, (_, i): FlowEdge => ({ from: 'stock', to: 'reservar', label: `caso ${i}` }))
      ]

      expect(problemsOf(app(validFlow({ edges })))).toContain('flows[0]: at most 60 edges are allowed (found 61)')
    })

    it('rechaza un texto de nodo vacío o de más de 120 caracteres', () => {
      const emptied = validFlow().nodes.map(n => (n.id === 'pedir' ? { ...n, text: '' } : n))
      const oversized = validFlow().nodes.map(n => (n.id === 'pedir' ? { ...n, text: 'x'.repeat(121) } : n))

      expect(problemsOf(app(validFlow({ nodes: emptied })))).toContain('flows[0].nodes[3]: text must be 1-120 characters')
      expect(problemsOf(app(validFlow({ nodes: oversized })))).toContain(
        'flows[0].nodes[3]: text must be 1-120 characters'
      )
    })

    it('rechaza una etiqueta de arista de más de 20 caracteres', () => {
      const edges = validFlow().edges.map(e => (e.label === 'sí' ? { ...e, label: 'x'.repeat(21) } : e))

      expect(problemsOf(app(validFlow({ edges })))).toContain('flows[0].edges[1]: label must be 1-20 characters')
    })

    it('rechaza una descripción de más de 300 caracteres', () => {
      expect(problemsOf(app(validFlow({ description: 'x'.repeat(301) })))).toContain(
        'flows[0]: description must be at most 300 characters'
      )
    })
  })

  /**
   * El estado en que queda la entidad al terminar el paso. Aquí solo se valida la FORMA
   * (no vacío, tope): que el valor exista en el enum de la entidad es cosa de la frontera,
   * que sí conoce los recursos — igual que `entity` y que `widget.resource`.
   */
  describe('estado del paso', () => {
    const withStatus = (status: string): BusinessFlow => {
      const nodes = validFlow().nodes.map(node => (node.id === 'reservar' ? { ...node, status } : node))
      return validFlow({ nodes })
    }

    it('acepta un paso que declara el estado en que deja a su entidad', () => {
      expect(problemsOf(app(withStatus('reservado')))).toEqual([])
    })

    it('rechaza un estado vacío', () => {
      expect(problemsOf(app(withStatus('')))).toContain('flows[0].nodes[2]: status must be 1-40 characters')
    })

    it('rechaza un estado de más de 40 caracteres', () => {
      expect(problemsOf(app(withStatus('x'.repeat(41))))).toContain('flows[0].nodes[2]: status must be 1-40 characters')
    })

    it('un estado sin entidad no tiene dueño: se rechaza', () => {
      const nodes = validFlow().nodes.map(node => (node.id === 'pedir' ? { ...node, status: 'pedido' } : node))

      expect(problemsOf(app(validFlow({ nodes })))).toContain(
        "flows[0].nodes[3]: status requires 'entity' (whose state is it?)"
      )
    })
  })
})
