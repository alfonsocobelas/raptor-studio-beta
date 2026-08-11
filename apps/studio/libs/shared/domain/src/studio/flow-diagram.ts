import type { BusinessFlow, FlowNodeKind } from '@acc/schema'
import type { NodeBox, NodePosition } from './model-diagram'

/**
 * Helpers puros de la vista de flujos (spec 28). Como en la vista de modelo,
 * el layout es cosmético: capas BFS deterministas que viven en memoria del
 * componente y jamás entran al app-schema.
 */
export const FLOW_GRID = {
  /** la celda deja aire entre columnas: la tarjeta de acciones mide 240 de ancho */
  colWidth: 320,
  rowHeight: 150,
  margin: 40
} as const

/** Dimensiones fijas del nodo de flujo: la píldora es CSS, la geometría es esta. */
export const FLOW_NODE = {
  width: 200,
  height: 62
} as const

/** La decisión es un ROMBO, y un rombo solo se lee como rombo si es cuadrado. */
export const FLOW_DECISION = {
  size: 128,
  /** Radio de las puntas: el prototipo las tiene romas, no en pico. */
  corner: 12
} as const

export function flowNodeSize(kind?: FlowNodeKind): { width: number; height: number } {
  return kind === 'decision'
    ? { width: FLOW_DECISION.size, height: FLOW_DECISION.size }
    : { width: FLOW_NODE.width, height: FLOW_NODE.height }
}

export function flowNodeBox(position: NodePosition, kind?: FlowNodeKind): NodeBox {
  return { x: position.x, y: position.y, ...flowNodeSize(kind) }
}

/**
 * Capa = distancia BFS al start; dentro de cada capa, orden alfabético por id.
 * Los nodos inalcanzables (el gate ya los rechaza) caen en una capa extra al
 * final para que nunca desaparezcan del lienzo. Sin start → layout vacío.
 */
/** El proceso se puede leer en fila (izquierda→derecha) o en columna (arriba→abajo). */
export type FlowOrientation = 'horizontal' | 'vertical'

/** ¿Se pisan estas dos cajas? */
function seSolapan(a: NodeBox, b: NodeBox): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/**
 * @param frozen Posiciones ya colocadas (arrastradas o congeladas por una edición
 *   anterior): se respetan TAL CUAL. Editar la topología —borrar un paso, meter uno
 *   en medio— no puede reordenar lo que el ojo ya tenía situado; el layout por capas
 *   solo decide dónde aterrizan los nodos que aún no tienen sitio.
 */
export function flowLayout(
  flow: BusinessFlow,
  orientation: FlowOrientation = 'horizontal',
  frozen: Record<string, NodePosition> = {},
  /** Tamaño de un nodo cuando no es el de siempre (una tarjeta de acciones crece con sus filas). */
  sizeOf: (id: string) => { width: number; height: number } | undefined = () => undefined
): Record<string, NodePosition> {
  const start = flow.nodes.find(node => node.kind === 'start')
  if (!start) return {}

  const depthOf = new Map<string, number>([[start.id, 0]])
  const queue = [start.id]
  while (queue.length) {
    const current = queue.shift() as string
    const depth = depthOf.get(current) as number
    for (const edge of flow.edges) {
      if (edge.from !== current || depthOf.has(edge.to)) continue
      depthOf.set(edge.to, depth + 1)
      queue.push(edge.to)
    }
  }

  const deepest = Math.max(...depthOf.values())
  const layers = new Map<number, string[]>()
  for (const node of flow.nodes) {
    const depth = depthOf.get(node.id) ?? deepest + 1
    layers.set(depth, [...(layers.get(depth) ?? []), node.id])
  }

  // La capa avanza en el eje del proceso y los nodos que la comparten (las ramas de
  // una decisión) se reparten en el eje perpendicular. Lo congelado no se toca; lo
  // demás aterriza en su hueco de capa y, si está pisado, se aparta una fila.
  const kinds = new Map(flow.nodes.map(node => [node.id, node.kind]))
  // solo el TAMAÑO: si `sizeOf` devuelve una caja entera, su x/y no puede colarse
  // en la posición del hueco (lo hacía, y mandaba las tarjetas al origen)
  const tamano = (id: string) => {
    const { width, height } = sizeOf(id) ?? flowNodeSize(kinds.get(id))
    return { width, height }
  }
  const positions: Record<string, NodePosition> = {}
  const puestas: NodeBox[] = []
  for (const node of flow.nodes) {
    if (!frozen[node.id]) continue
    positions[node.id] = frozen[node.id]
    puestas.push({ ...frozen[node.id], ...tamano(node.id) })
  }

  for (const [depth, ids] of layers) {
    ;[...ids].sort().forEach((sibling, index) => {
      if (positions[sibling]) return
      // el nodo se CENTRA en su hueco: un rombo de 128 alineado por arriba junto a
      // píldoras de 62 dejaría la flecha subiendo y bajando en cada decisión
      const size = tamano(sibling)
      const dx = (FLOW_NODE.width - size.width) / 2
      const dy = (FLOW_NODE.height - size.height) / 2
      const slot = (paso: number): NodePosition =>
        orientation === 'horizontal'
          ? {
              x: FLOW_GRID.margin + depth * FLOW_GRID.colWidth + dx,
              y: FLOW_GRID.margin + (index + paso) * FLOW_GRID.rowHeight + dy
            }
          : {
              x: FLOW_GRID.margin + (index + paso) * FLOW_GRID.colWidth + dx,
              y: FLOW_GRID.margin + depth * FLOW_GRID.rowHeight + dy
            }
      let paso = 0
      // tope defensivo: mejor un solape que un bucle infinito en un render
      while (paso < 50 && puestas.some(puesta => seSolapan({ ...slot(paso), ...size }, puesta))) paso++
      positions[sibling] = slot(paso)
      puestas.push({ ...slot(paso), ...size })
    })
  }
  return positions
}

export interface FlowEdgeCurve {
  x1: number
  y1: number
  x2: number
  y2: number
  /** Trazo SVG listo para `path[d]` */
  d: string
  labelX: number
  labelY: number
}

/**
 * La flecha de un flujo es HORIZONTAL: el proceso avanza por columnas, así que sale
 * por el costado del nodo y entra por el costado del siguiente, con los tiradores en
 * horizontal para que el trazo salga y entre plano. Si el destino queda a la izquierda
 * (un bucle hacia atrás), se invierten los lados en vez de cruzar el nodo.
 */
export function flowEdgeCurve(from: NodeBox, to: NodeBox, orientation: FlowOrientation = 'horizontal'): FlowEdgeCurve {
  if (orientation === 'vertical') {
    const haciaAbajo = to.y >= from.y
    const x1 = from.x + from.width / 2
    const x2 = to.x + to.width / 2
    const y1 = haciaAbajo ? from.y + from.height : from.y
    const y2 = haciaAbajo ? to.y : to.y + to.height

    const tirador = Math.max(24, Math.abs(y2 - y1) / 2)
    const cy1 = haciaAbajo ? y1 + tirador : y1 - tirador
    const cy2 = haciaAbajo ? y2 - tirador : y2 + tirador

    return {
      x1,
      y1,
      x2,
      y2,
      d: `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2
    }
  }

  const haciaLaDerecha = to.x >= from.x
  const y1 = from.y + from.height / 2
  const y2 = to.y + to.height / 2
  const x1 = haciaLaDerecha ? from.x + from.width : from.x
  const x2 = haciaLaDerecha ? to.x : to.x + to.width

  const tirador = Math.max(24, Math.abs(x2 - x1) / 2)
  const cx1 = haciaLaDerecha ? x1 + tirador : x1 - tirador
  const cx2 = haciaLaDerecha ? x2 - tirador : x2 + tirador

  return {
    x1,
    y1,
    x2,
    y2,
    d: `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`,
    labelX: (x1 + x2) / 2,
    labelY: (y1 + y2) / 2
  }
}

/** Las dos ramas que reparte una decisión, en el orden en que las dibujaría cualquiera. */
export const FLOW_BRANCHES = ['sí', 'no'] as const

/**
 * Etiqueta que le toca a una salida NUEVA de una decisión: la primera libre de
 * `FLOW_BRANCHES`. Es un conjunto a repartir, no un contador —contando salidas,
 * borrar la rama «sí» y volver a dibujarla la creaba como «no» y quedaban dos «no»—.
 * Lo que no sale de una decisión no lleva etiqueta; con las dos ramas ya puestas se
 * deja en blanco, porque ahí ya no hay convención que adivinar.
 */
export function flowBranchLabel(flow: BusinessFlow, from: string): string | undefined {
  if (flow.nodes.find(node => node.id === from)?.kind !== 'decision') return undefined
  const puestas = new Set(flow.edges.filter(edge => edge.from === from).map(edge => edge.label))
  return FLOW_BRANCHES.find(branch => !puestas.has(branch)) ?? ''
}

/**
 * Salidas ALTERNATIVAS de las decisiones: la primera es el camino principal y el
 * resto son las alternativas, que la referencia dibuja en trazo discontinuo. Solo
 * cuenta lo que sale de una decisión: un paso con dos salidas no bifurca, va a dos
 * sitios. La clave es `from→to`, la misma identidad que usa el lienzo.
 */
export function flowAlternateEdges(flow: BusinessFlow): Set<string> {
  const decisiones = new Set(flow.nodes.filter(node => node.kind === 'decision').map(node => node.id))
  const vistas = new Set<string>()
  const alternativas = new Set<string>()

  for (const edge of flow.edges) {
    if (!decisiones.has(edge.from)) continue
    if (vistas.has(edge.from)) alternativas.add(`${edge.from}→${edge.to}`)
    vistas.add(edge.from)
  }
  return alternativas
}
