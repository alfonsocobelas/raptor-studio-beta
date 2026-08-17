import type { AccessDefinition, StateMachine } from '@raptor/schema'
import { resolveAccess } from '@raptor/schema'
import { flowEdgeCurve } from './flow-diagram'

/**
 * El grafo de accesos (spec 49, maquetas 26B/26C): proyección PURA del diseño con el
 * MISMO idioma que Flujos — un nodo de rol a la izquierda, una tarjeta por entidad a la
 * derecha y curvas bezier entre ambos, trazadas con `flowEdgeCurve` para que las flechas
 * de las dos pestañas sean la misma curva y no dos parecidas.
 *
 * Se dibuja UN rol cada vez: el activo. Admin puede todo y repetir sus aristas en cada
 * entidad no cuenta nada; lo interesante es qué reparte la matriz entre Usuario y Consulta.
 */
export const ACCESS_LAYOUT = {
  role: { width: 260, height: 92 },
  card: { width: 380, headerHeight: 44, chipHeight: 30, chipGap: 8, padding: 14 },
  /** Hueco vertical entre tarjetas y separación horizontal rol → tarjetas */
  gap: 36,
  columnGap: 200
} as const

export type AccessActorRole = 'admin' | 'user' | 'viewer'

/** Lo que el grafo necesita de cada entidad; DraftResource lo satisface tal cual. */
export interface AccessDiagramEntity {
  name: string
  labelPlural: string
  state?: StateMachine
  access?: AccessDefinition
}

export type AccessBadge = 'editar' | 'solo ver' | 'sin acceso'

export interface AccessChip {
  /** 'view', 'manage' o el verbo de la transición */
  capability: string
  label: string
  granted: boolean
  tone: 'read' | 'write'
}

export interface AccessRoleNode {
  role: AccessActorRole
  label: string
  /** «4 capacidades · hereda de ninguno» — hechos del diseño, nada inventado */
  subtitle: string
  /** El color con el que se pinta este rol y sus flechas */
  accent: AccessActorRole
  /** write si el rol toca algo en alguna entidad; read si solo mira */
  tone: 'read' | 'write'
  x: number
  y: number
  width: number
  height: number
}

export interface AccessEntityCard {
  entity: string
  label: string
  badge: AccessBadge
  chips: AccessChip[]
  x: number
  y: number
  width: number
  height: number
}

export interface AccessGraphEdge {
  entity: string
  /** read = solo mira; write = además toca */
  tone: 'read' | 'write'
  /** El rol activo, para que la flecha cambie de color al cambiar de rol */
  accent: AccessActorRole
  x1: number
  y1: number
  x2: number
  y2: number
  /** Trazo SVG listo para `path[d]`, misma curva que las flechas de Flujos */
  d: string
}

export interface AccessGraphLayout {
  role: AccessRoleNode
  cards: AccessEntityCard[]
  edges: AccessGraphEdge[]
  width: number
  height: number
}

const ROLE_LABELS: Record<AccessActorRole, string> = {
  admin: 'Administrador',
  user: 'Usuario',
  viewer: 'Consulta'
}

export function accessGraph(entities: AccessDiagramEntity[], role: AccessActorRole): AccessGraphLayout {
  const { card, gap, columnGap } = ACCESS_LAYOUT
  const cardX = ACCESS_LAYOUT.role.width + columnGap

  const cards: AccessEntityCard[] = []
  let y = 0
  let granted = 0

  for (const entity of entities) {
    const chips = chipsOf(entity, role)
    granted += chips.filter(chip => chip.granted).length
    const height = card.headerHeight + card.padding * 2 + card.chipHeight
    cards.push({
      entity: entity.name,
      label: entity.labelPlural,
      badge: badgeOf(chips),
      chips,
      x: cardX,
      y,
      width: card.width,
      height
    })
    y += height + gap
  }

  const contentHeight = Math.max(0, y - gap)
  const height = Math.max(contentHeight, ACCESS_LAYOUT.role.height)

  const roleNode: AccessRoleNode = {
    role,
    tone: cards.some(card => card.badge === 'editar') ? 'write' : 'read',
    label: ROLE_LABELS[role],
    subtitle: role === 'admin' ? 'puede todo · no se edita' : `${granted} capacidades · hereda de ninguno`,
    accent: role,
    x: 0,
    y: height / 2 - ACCESS_LAYOUT.role.height / 2,
    width: ACCESS_LAYOUT.role.width,
    height: ACCESS_LAYOUT.role.height
  }

  // la curva es la MISMA función que dibuja las flechas de Flujos: un solo trazo en el estudio
  const edges: AccessGraphEdge[] = cards
    .filter(target => target.badge !== 'sin acceso')
    .map(target => {
      const curve = flowEdgeCurve(roleNode, target, 'horizontal')
      return {
        entity: target.entity,
        tone: target.badge === 'editar' ? ('write' as const) : ('read' as const),
        accent: role,
        x1: curve.x1,
        y1: curve.y1,
        x2: curve.x2,
        y2: curve.y2,
        d: curve.d
      }
    })

  if (!entities.length) {
    return { role: { ...roleNode, y: 0 }, cards: [], edges: [], width: 0, height: 0 }
  }

  return { role: roleNode, cards, edges, width: cardX + card.width, height }
}

/** Ver · Gestionar (create/edit/delete juntos, como la maqueta) · un chip por transición. */
function chipsOf(entity: AccessDiagramEntity, role: AccessActorRole): AccessChip[] {
  const resolved = resolveAccess(entity)
  const has = (roles: readonly string[]) => role === 'admin' || roles.includes(role)

  return [
    {
      capability: 'view',
      label: `Ver ${entity.labelPlural}`,
      granted: has(resolved.view),
      tone: 'read' as const
    },
    {
      capability: 'manage',
      label: `Gestionar ${entity.labelPlural}`,
      granted: has(resolved.create) || has(resolved.edit) || has(resolved.delete),
      tone: 'write' as const
    },
    ...(entity.state?.transitions ?? []).map(transition => ({
      capability: transition.name,
      label: transition.label,
      granted: has(resolved.transitions[transition.name] ?? []),
      tone: 'write' as const
    }))
  ]
}

function badgeOf(chips: AccessChip[]): AccessBadge {
  if (chips.some(chip => chip.granted && chip.tone === 'write')) return 'editar'
  if (chips.some(chip => chip.granted)) return 'solo ver'
  return 'sin acceso'
}
