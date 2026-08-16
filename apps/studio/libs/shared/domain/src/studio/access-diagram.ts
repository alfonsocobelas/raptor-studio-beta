import type { AccessDefinition, StateMachine } from '@raptor/schema'
import { resolveAccess } from '@raptor/schema'

/**
 * El diagrama de casos de uso (spec 46): proyección PURA del diseño (entidades +
 * máquinas + matriz de accesos), misma doctrina que model/state/flow-diagram — el
 * layout se calcula, nunca se almacena. Actores a la izquierda, una caja de sistema
 * por entidad con sus elipses de capacidad, aristas actor→capacidad según la matriz
 * EFECTIVA (defectos resueltos por resolveAccess; admin conecta con todo).
 */
export const ACCESS_LAYOUT = {
  actor: { width: 120, height: 48, gap: 48 },
  ellipse: { width: 200, height: 40, gap: 16 },
  box: { padding: 24, headerHeight: 36, gap: 48 },
  columnGap: 160
} as const

export type AccessActorRole = 'admin' | 'user' | 'viewer'

/** Lo que el diagrama necesita de cada entidad; DraftResource lo satisface tal cual. */
export interface AccessDiagramEntity {
  name: string
  labelPlural: string
  state?: StateMachine
  access?: AccessDefinition
}

export interface AccessActor {
  role: AccessActorRole
  label: string
  x: number
  y: number
}

export interface AccessSystemBox {
  entity: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface AccessCapability {
  /** `${entidad}:${capacidad}` — view, manage o el verbo de la transición */
  key: string
  entity: string
  capability: string
  label: string
  cx: number
  cy: number
  rx: number
  ry: number
}

export interface AccessEdge {
  role: AccessActorRole
  capability: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface AccessDiagramLayout {
  actors: AccessActor[]
  boxes: AccessSystemBox[]
  capabilities: AccessCapability[]
  edges: AccessEdge[]
  width: number
  height: number
}

const ACTOR_LABELS: Record<AccessActorRole, string> = {
  admin: 'Administrador',
  user: 'Usuario',
  viewer: 'Consulta'
}

export function accessDiagram(entities: AccessDiagramEntity[]): AccessDiagramLayout {
  if (!entities.length) {
    return { actors: [], boxes: [], capabilities: [], edges: [], width: 0, height: 0 }
  }

  const { actor, ellipse, box, columnGap } = ACCESS_LAYOUT
  const boxWidth = ellipse.width + box.padding * 2
  const boxX = actor.width + columnGap

  const boxes: AccessSystemBox[] = []
  const capabilities: AccessCapability[] = []
  const grants: { role: AccessActorRole; capability: AccessCapability }[] = []

  let y = 0
  for (const entity of entities) {
    const resolved = resolveAccess(entity)
    // capacidades en orden fijo: Ver/Crear/Editar/Borrar (spec 49) y una por transición de su máquina
    const caps: { capability: string; label: string; roles: string[] }[] = [
      { capability: 'view', label: `Ver ${entity.labelPlural}`, roles: resolved.view },
      { capability: 'create', label: `Crear ${entity.labelPlural}`, roles: resolved.create },
      { capability: 'edit', label: `Editar ${entity.labelPlural}`, roles: resolved.edit },
      { capability: 'delete', label: `Borrar ${entity.labelPlural}`, roles: resolved.delete },
      ...(entity.state?.transitions ?? []).map(transition => ({
        capability: transition.name,
        label: transition.label,
        roles: resolved.transitions[transition.name] ?? []
      }))
    ]

    const height = box.headerHeight + box.padding * 2 + caps.length * ellipse.height + (caps.length - 1) * ellipse.gap
    boxes.push({ entity: entity.name, label: entity.labelPlural, x: boxX, y, width: boxWidth, height })

    caps.forEach((cap, index) => {
      const capability: AccessCapability = {
        key: `${entity.name}:${cap.capability}`,
        entity: entity.name,
        capability: cap.capability,
        label: cap.label,
        cx: boxX + boxWidth / 2,
        cy: y + box.headerHeight + box.padding + index * (ellipse.height + ellipse.gap) + ellipse.height / 2,
        rx: ellipse.width / 2,
        ry: ellipse.height / 2
      }
      capabilities.push(capability)
      // admin es implícito y conecta con todo; user/viewer según la matriz efectiva
      for (const role of ['admin', 'user', 'viewer'] as const) {
        if (role === 'admin' || cap.roles.includes(role)) grants.push({ role, capability })
      }
    })

    y += height + box.gap
  }

  const contentHeight = y - box.gap
  const actorsHeight = 3 * actor.height + 2 * actor.gap
  const height = Math.max(contentHeight, actorsHeight)

  // los tres actores fijos, repartidos sobre la altura del dibujo
  const actors: AccessActor[] = (['admin', 'user', 'viewer'] as const).map((role, index) => ({
    role,
    label: ACTOR_LABELS[role],
    x: 0,
    y: (height * (index + 1)) / 4 - actor.height / 2
  }))
  const actorAt = new Map(actors.map(a => [a.role, a]))

  const edges: AccessEdge[] = grants.map(({ role, capability }) => {
    const from = actorAt.get(role) as AccessActor
    return {
      role,
      capability: capability.key,
      x1: from.x + actor.width,
      y1: from.y + actor.height / 2,
      x2: capability.cx - capability.rx,
      y2: capability.cy
    }
  })

  return { actors, boxes, capabilities, edges, width: boxX + boxWidth, height }
}
