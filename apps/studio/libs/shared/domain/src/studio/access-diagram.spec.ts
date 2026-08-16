import { describe, expect, it } from 'vitest'
import { ACCESS_LAYOUT, accessDiagram, type AccessDiagramEntity } from './access-diagram'

/**
 * Spec 46: el diagrama de casos de uso es una PROYECCIÓN pura del diseño (entidades +
 * máquinas + matriz de accesos) — misma doctrina que model/state/flow-diagram. Actores a
 * la izquierda, una caja de sistema por entidad con sus elipses de capacidad, aristas
 * actor→capacidad según la matriz EFECTIVA (defectos de resolveAccess; admin con todo).
 */
describe('accessDiagram', () => {
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

  it('pinta los tres actores fijos a la izquierda de las cajas', () => {
    const diagram = accessDiagram([factura()])

    expect(diagram.actors.map(a => a.role)).toEqual(['admin', 'user', 'viewer'])
    expect(diagram.actors.map(a => a.label)).toEqual(['Administrador', 'Usuario', 'Consulta'])
    const boxLeft = Math.min(...diagram.boxes.map(b => b.x))
    expect(diagram.actors.every(a => a.x + ACCESS_LAYOUT.actor.width < boxLeft)).toBe(true)
  })

  it('una caja de sistema por entidad con las cuatro capacidades y una elipse por transición', () => {
    const diagram = accessDiagram([factura(), cliente])

    expect(diagram.boxes.map(b => b.entity)).toEqual(['factura', 'cliente'])
    const deFactura = diagram.capabilities.filter(c => c.entity === 'factura')
    expect(deFactura.map(c => c.label)).toEqual([
      'Ver Facturas',
      'Crear Facturas',
      'Editar Facturas',
      'Borrar Facturas',
      'Aprobar'
    ])
    // sin máquina no hay elipses de transición
    expect(diagram.capabilities.filter(c => c.entity === 'cliente').map(c => c.label)).toEqual([
      'Ver Clientes',
      'Crear Clientes',
      'Editar Clientes',
      'Borrar Clientes'
    ])
    // cada elipse queda dentro de la caja de su entidad
    for (const capability of deFactura) {
      const box = diagram.boxes.find(b => b.entity === 'factura')
      expect(capability.cy).toBeGreaterThan(box?.y ?? Infinity)
      expect(capability.cy).toBeLessThan((box?.y ?? 0) + (box?.height ?? 0))
    }
  })

  it('sin matriz aplica la política actual: viewer solo Ver, user todo, admin todo', () => {
    const diagram = accessDiagram([factura()])
    const edgesOf = (role: string) =>
      diagram.edges.filter(e => e.role === role).map(e => e.capability)

    const todas = ['factura:view', 'factura:create', 'factura:edit', 'factura:delete', 'factura:aprobar']
    expect(edgesOf('admin')).toEqual(todas)
    expect(edgesOf('user')).toEqual(todas)
    expect(edgesOf('viewer')).toEqual(['factura:view'])
  })

  it('la matriz granular gobierna las aristas; admin conecta con todo aunque quede solo', () => {
    const diagram = accessDiagram([
      factura({ view: ['user'], create: [], edit: ['user'], delete: [], transitions: { aprobar: [] } })
    ])
    const edgesOf = (role: string) =>
      diagram.edges.filter(e => e.role === role).map(e => e.capability)

    expect(edgesOf('admin')).toEqual([
      'factura:view',
      'factura:create',
      'factura:edit',
      'factura:delete',
      'factura:aprobar'
    ])
    expect(edgesOf('user')).toEqual(['factura:view', 'factura:edit'])
    expect(edgesOf('viewer')).toEqual([])
  })

  it('el azúcar legado manage sigue gobernando las tres capacidades de escritura', () => {
    const diagram = accessDiagram([factura({ manage: ['user', 'viewer'] })])
    const edgesOf = (role: string) =>
      diagram.edges.filter(e => e.role === role).map(e => e.capability)

    expect(edgesOf('viewer')).toEqual(['factura:view', 'factura:create', 'factura:edit', 'factura:delete'])
  })

  it('las aristas van del borde derecho del actor al vértice izquierdo de la elipse', () => {
    const diagram = accessDiagram([factura()])
    const edge = diagram.edges.find(e => e.role === 'viewer')
    const viewer = diagram.actors.find(a => a.role === 'viewer')
    const view = diagram.capabilities.find(c => c.key === 'factura:view')

    expect(edge?.x1).toBe((viewer?.x ?? 0) + ACCESS_LAYOUT.actor.width)
    expect(edge?.x2).toBe((view?.cx ?? 0) - (view?.rx ?? 0))
  })

  it('sin entidades devuelve un layout vacío', () => {
    const diagram = accessDiagram([])

    expect(diagram.boxes).toEqual([])
    expect(diagram.edges).toEqual([])
    expect(diagram.width).toBe(0)
    expect(diagram.height).toBe(0)
  })

  it('es determinista: el mismo diseño produce el mismo dibujo', () => {
    expect(accessDiagram([factura(), cliente])).toEqual(accessDiagram([factura(), cliente]))
  })
})
