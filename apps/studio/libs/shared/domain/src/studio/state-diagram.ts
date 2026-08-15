import type { StateMachine } from '@acc/schema'
import { unreachableStates } from '@acc/schema'
import type { DraftEnumValue } from './draft-resource'

/**
 * El dibujo de la máquina de estados (spec 43): proyección PURA del par (enum, máquina),
 * misma doctrina que model-diagram y flow-diagram — el layout se calcula, nunca se
 * almacena. Fila horizontal en el orden del enum; las flechas adyacentes van rectas y
 * las demás arquean (adelante por arriba, atrás por abajo) para no pisarse.
 */
export const STATE_NODE = { width: 150, height: 44, gap: 70 } as const

/** Altura reservada sobre/bajo la fila para los arcos largos. */
const ARC_LANE = 56

export interface StateDiagramNode {
  value: string
  label: string
  x: number
  y: number
  initial: boolean
  unreachable: boolean
}

export interface StateDiagramEdge {
  /** `${name}:${from}` — única aunque la transición tenga varios orígenes */
  key: string
  name: string
  label: string
  from: string
  to: string
  path: string
  labelX: number
  labelY: number
}

export interface StateDiagramLayout {
  nodes: StateDiagramNode[]
  edges: StateDiagramEdge[]
  width: number
  height: number
}

export function stateDiagram(machine: StateMachine, values: DraftEnumValue[]): StateDiagramLayout {
  const unreachable = new Set(
    unreachableStates(
      values.map(v => v.value),
      machine
    )
  )

  const rowY = ARC_LANE
  const nodes: StateDiagramNode[] = values.map((value, index) => ({
    value: value.value,
    label: value.label,
    x: index * (STATE_NODE.width + STATE_NODE.gap),
    y: rowY,
    initial: value.value === machine.initial,
    unreachable: unreachable.has(value.value)
  }))
  const at = new Map(nodes.map(node => [node.value, node]))

  const edges: StateDiagramEdge[] = []
  for (const transition of machine.transitions) {
    for (const origin of transition.from) {
      const from = at.get(origin)
      const to = at.get(transition.to)
      if (!from || !to) continue
      edges.push(edgeBetween(transition.name, transition.label, from, to))
    }
  }

  return {
    nodes,
    edges,
    width: values.length * (STATE_NODE.width + STATE_NODE.gap) - STATE_NODE.gap,
    height: rowY + STATE_NODE.height + ARC_LANE
  }
}

function edgeBetween(name: string, label: string, from: StateDiagramNode, to: StateDiagramNode): StateDiagramEdge {
  const midY = from.y + STATE_NODE.height / 2
  const forward = to.x > from.x
  const distance = Math.abs(to.x - from.x) / (STATE_NODE.width + STATE_NODE.gap)

  // vecinos: recta de borde a borde a media altura
  if (forward && distance <= 1) {
    const x1 = from.x + STATE_NODE.width
    const x2 = to.x
    return { key: `${name}:${from.value}`, name, label, from: from.value, to: to.value, path: `M ${x1} ${midY} L ${x2} ${midY}`, labelX: (x1 + x2) / 2, labelY: midY - 8 }
  }

  // largos: arco por arriba (adelante) o por abajo (atrás), tanto más alto cuanto más lejos
  const bow = Math.min(ARC_LANE - 8, 24 + distance * 10)
  const y = forward ? from.y : from.y + STATE_NODE.height
  const apexY = forward ? y - bow : y + bow
  const x1 = from.x + STATE_NODE.width / 2
  const x2 = to.x + STATE_NODE.width / 2
  return {
    key: `${name}:${from.value}`,
    name,
    label,
    from: from.value,
    to: to.value,
    path: `M ${x1} ${y} Q ${(x1 + x2) / 2} ${apexY} ${x2} ${y}`,
    labelX: (x1 + x2) / 2,
    labelY: forward ? apexY + 2 : apexY + 12
  }
}
