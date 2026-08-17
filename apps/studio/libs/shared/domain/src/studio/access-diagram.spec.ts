import { describe, expect, it } from 'vitest'
import { ACCESS_LAYOUT, accessGraph, type AccessDiagramEntity } from './access-diagram'

/**
 * Spec 49 (maquetas 26B/26C): el grafo de accesos habla el idioma de Flujos — un nodo de
 * ROL a la izquierda, una tarjeta por entidad a la derecha y curvas bezier entre ambos,
 * con la MISMA geometría que las flechas de flujo. Solo se dibuja el rol activo: admin
 * puede todo y repetir sus aristas no cuenta nada.
 */
describe('accessGraph', () => {
  const factura = (access?: AccessDiagramEntity['access']): AccessDiagramEntity => ({
    name: 'factura',
    labelPlural: 'Facturas',
    state: {
      field: 'estado',
      initial: 'borrador',
      transitions: [{ name: 'aprobar', label: 'Aprobar', from: ['borrador'], to: 'aprobada' }]
    },
    ...(access ? { access } : {})
  })

  const cliente: AccessDiagramEntity = { name: 'cliente', labelPlural: 'Clientes' }

  it('pinta el nodo del rol activo a la izquierda de las tarjetas', () => {
    const graph = accessGraph([cliente], 'user')

    expect(graph.role.label).toBe('Usuario')
    expect(graph.role.x + graph.role.width).toBeLessThanOrEqual(graph.cards[0].x)
  })

  it('una tarjeta por entidad, con su chip de Ver y de Gestionar', () => {
    const graph = accessGraph([cliente], 'user')

    expect(graph.cards.map(c => c.entity)).toEqual(['cliente'])
    expect(graph.cards[0].chips.map(c => c.label)).toEqual(['Ver Clientes', 'Gestionar Clientes'])
    expect(graph.cards[0].chips.map(c => c.granted)).toEqual([true, true])
  })

  it('la máquina de estados añade un chip por transición', () => {
    const graph = accessGraph([factura()], 'user')

    expect(graph.cards[0].chips.map(c => c.label)).toEqual(['Ver Facturas', 'Gestionar Facturas', 'Aprobar'])
  })

  it('el badge resume la tarjeta: editar, solo ver o sin acceso', () => {
    const editar = accessGraph([cliente], 'user').cards[0]
    const soloVer = accessGraph([cliente], 'viewer').cards[0]
    const sin = accessGraph([{ ...cliente, access: { view: [], create: [], edit: [], delete: [] } }], 'user').cards[0]

    expect(editar.badge).toBe('editar')
    expect(soloVer.badge).toBe('solo ver')
    expect(sin.badge).toBe('sin acceso')
  })

  it('la arista toma el tono de lo que el rol puede hacer', () => {
    expect(accessGraph([cliente], 'user').edges[0].tone).toBe('write')
    expect(accessGraph([cliente], 'viewer').edges[0].tone).toBe('read')
  })

  it('sin ninguna capacidad no hay arista y la tarjeta queda apagada', () => {
    const graph = accessGraph([{ ...cliente, access: { view: [], create: [], edit: [], delete: [] } }], 'user')

    expect(graph.edges).toEqual([])
    expect(graph.cards[0].badge).toBe('sin acceso')
  })

  it('admin lo puede todo: cada tarjeta en modo editar', () => {
    const graph = accessGraph([factura({ view: [], create: [], edit: [], delete: [] }), cliente], 'admin')

    expect(graph.cards.every(c => c.badge === 'editar')).toBe(true)
    expect(graph.edges.every(e => e.tone === 'write')).toBe(true)
  })

  it('la curva sale del puerto del rol y entra por el borde izquierdo de la tarjeta', () => {
    const graph = accessGraph([cliente], 'user')
    const edge = graph.edges[0]

    expect(edge.x1).toBe(graph.role.x + graph.role.width)
    expect(edge.x2).toBe(graph.cards[0].x)
    expect(edge.d.startsWith('M ')).toBe(true)
    expect(edge.d).toContain(' C ')
  })

  it('la tarjeta crece con sus chips y las de abajo no se solapan', () => {
    const graph = accessGraph([factura(), cliente], 'user')
    const [arriba, abajo] = graph.cards

    expect(arriba.height).toBeGreaterThanOrEqual(ACCESS_LAYOUT.card.headerHeight)
    expect(abajo.y).toBeGreaterThanOrEqual(arriba.y + arriba.height)
  })

  it('cada rol tiñe sus flechas: el grafo se lee de un vistazo al cambiar de rol', () => {
    expect(accessGraph([cliente], 'user').role.accent).toBe('user')
    expect(accessGraph([cliente], 'viewer').role.accent).toBe('viewer')
    expect(accessGraph([cliente], 'admin').role.accent).toBe('admin')
    // la arista hereda el acento del rol activo, además de su tono de capacidad
    expect(accessGraph([cliente], 'viewer').edges[0].accent).toBe('viewer')
  })

  it('el nodo del rol toma el tono de lo que ese rol hace en conjunto', () => {
    expect(accessGraph([cliente], 'user').role.tone).toBe('write')
    // consulta solo mira: su puerto no debe ir del color de escritura
    expect(accessGraph([cliente], 'viewer').role.tone).toBe('read')
  })

  it('sin entidades devuelve un grafo vacío', () => {
    const graph = accessGraph([], 'user')

    expect(graph.cards).toEqual([])
    expect(graph.edges).toEqual([])
    expect(graph.width).toBe(0)
    expect(graph.height).toBe(0)
  })

  it('es determinista: el mismo diseño produce el mismo dibujo', () => {
    expect(accessGraph([factura(), cliente], 'user')).toEqual(accessGraph([factura(), cliente], 'user'))
  })
})
