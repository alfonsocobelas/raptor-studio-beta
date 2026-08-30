import type { AccessDefinition, AccessRole, RoleDefinition } from '@raptor/schema'
import { resolveAccess } from '@raptor/schema'
import type { DraftResource } from './draft-resource'

/**
 * La tabla de accesos (spec 49): proyección PURA del diseño, misma doctrina que el
 * diagrama de casos de uso — filas de entidad, celdas Ver/Crear/Editar/Borrar más las
 * transiciones de su máquina. Toda mutación devuelve la matriz EXPLÍCITA completa y
 * granular (nunca el azúcar legado `manage`): lo marcado es lo que hay.
 */

/**
 * Un actor del modelo de accesos: los fijos (spec 46; admin es implícito y puede todo)
 * o un rol personalizado declarado en el diseño (spec 76).
 */
export type AccessActorRole = string

/** Orden estable user→viewer: el emitido no depende del orden de los clicks. */
const ROLE_ORDER: AccessRole[] = ['user', 'viewer']

/** Los roles otorgables del diseño: los fijos delante, los personalizados en su orden declarado. */
export function grantableRoles(custom: RoleDefinition[] = []): AccessRole[] {
  return [...ROLE_ORDER, ...custom.map(role => role.name)]
}

export interface AccessColumn {
  capability: 'view' | 'create' | 'edit' | 'delete'
  label: string
}

export const ACCESS_CRUD_COLUMNS: readonly AccessColumn[] = [
  { capability: 'view', label: 'Ver' },
  { capability: 'create', label: 'Crear' },
  { capability: 'edit', label: 'Editar' },
  { capability: 'delete', label: 'Borrar' }
]

export interface AccessCapabilityCell {
  /** 'view' | 'create' | 'edit' | 'delete' o el verbo de la transición */
  capability: string
  label: string
  kind: 'crud' | 'transition'
  /** Roles efectivos (admin es implícito y no aparece) */
  roles: AccessRole[]
}

export interface AccessTableRow {
  name: string
  label: string
  cells: AccessCapabilityCell[]
}

export function accessRows(resources: DraftResource[]): AccessTableRow[] {
  return resources.map(resource => {
    const resolved = resolveAccess(resource)
    return {
      name: resource.name,
      label: resource.labelPlural,
      cells: [
        ...ACCESS_CRUD_COLUMNS.map(column => ({
          capability: column.capability,
          label: column.label,
          kind: 'crud' as const,
          roles: resolved[column.capability]
        })),
        ...(resource.state?.transitions ?? []).map(transition => ({
          capability: transition.name,
          label: transition.label,
          kind: 'transition' as const,
          roles: resolved.transitions[transition.name] ?? []
        }))
      ]
    }
  })
}

/** La matriz explícita siguiente al conmutar entidad+capacidad+rol (un click de celda). */
export function toggleCapability(
  resource: DraftResource,
  capability: string,
  role: AccessRole,
  order: AccessRole[] = ROLE_ORDER
): AccessDefinition {
  return rebuild(resource, (current, at) => (at === capability ? flip(current, role, order) : current))
}

export interface RoleSummary {
  total: number
  view: number
  create: number
  edit: number
  delete: number
}

/** Métricas del panel derecho; admin puede todo por definición. */
export function roleSummary(resources: DraftResource[], role: AccessActorRole): RoleSummary {
  const count = (pick: (r: DraftResource) => AccessRole[]) =>
    role === 'admin' ? resources.length : resources.filter(r => pick(r).includes(role)).length

  return {
    total: resources.length,
    view: count(r => resolveAccess(r).view),
    create: count(r => resolveAccess(r).create),
    edit: count(r => resolveAccess(r).edit),
    delete: count(r => resolveAccess(r).delete)
  }
}

export type ColumnAction = 'grant-view' | 'revoke-writes'

/** Acción de columna del panel derecho, entidad a entidad: «Todo ver» / «Nada editar». */
export function applyColumn(
  resource: DraftResource,
  role: AccessRole,
  action: ColumnAction,
  order: AccessRole[] = ROLE_ORDER
): AccessDefinition {
  if (action === 'grant-view') {
    return rebuild(resource, (current, at) => (at === 'view' ? grant(current, role, order) : current))
  }
  return rebuild(resource, (current, at) => (at === 'view' ? current : revoke(current, role)))
}

/** «Copiar de {rol}»: el destino queda con EXACTAMENTE lo que tiene el origen. */
export function copyRoleAccess(
  resource: DraftResource,
  from: AccessRole,
  to: AccessRole,
  order: AccessRole[] = ROLE_ORDER
): AccessDefinition {
  return rebuild(resource, current => (current.includes(from) ? grant(current, to, order) : revoke(current, to)))
}

/** Reconstruye la matriz completa aplicando `fn` a cada capacidad — una sola forma de mutar. */
function rebuild(
  resource: DraftResource,
  fn: (current: AccessRole[], capability: string) => AccessRole[]
): AccessDefinition {
  const resolved = resolveAccess(resource)
  return {
    view: fn(resolved.view, 'view'),
    create: fn(resolved.create, 'create'),
    edit: fn(resolved.edit, 'edit'),
    delete: fn(resolved.delete, 'delete'),
    // sin máquina no hay clave: defineResource rechaza transitions en un recurso sin estado
    ...(resource.state
      ? {
          transitions: Object.fromEntries(
            resource.state.transitions.map(transition => [
              transition.name,
              fn(resolved.transitions[transition.name] ?? [], transition.name)
            ])
          )
        }
      : {})
  }
}

const ordered = (roles: AccessRole[], order: AccessRole[]): AccessRole[] => order.filter(role => roles.includes(role))
const grant = (roles: AccessRole[], role: AccessRole, order: AccessRole[]): AccessRole[] => ordered([...roles, role], order)
const revoke = (roles: AccessRole[], role: AccessRole): AccessRole[] => roles.filter(r => r !== role)
const flip = (roles: AccessRole[], role: AccessRole, order: AccessRole[]): AccessRole[] =>
  roles.includes(role) ? revoke(roles, role) : grant(roles, role, order)
