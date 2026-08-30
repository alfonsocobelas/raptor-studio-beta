import { names } from '@nx/devkit'
import type { RoleDefinition } from '@raptor/schema'

/**
 * Spec 76: cadenas de emisión de roles para las plantillas IAM. Con cero roles
 * personalizados reproducen EXACTAMENTE los literales actuales (gate de oro);
 * con roles extra los añaden detrás de los fijos, en el orden declarado.
 */

const BUILT_IN = ['admin', 'user', 'viewer'] as const

/** `back-office` → `BACK_OFFICE`: un toUpperCase directo emitiría un miembro ilegal. */
export function roleConstantName(role: string): string {
  return names(role).constantName
}

/** Miembros de `UserRoleEnum` (plantilla auth-enums). */
export function roleEnumMembersBlock(roles: RoleDefinition[]): string {
  const members = [...BUILT_IN, ...roles.map(r => r.name)]
  return members.map(value => `  ${roleConstantName(value)} = '${value}'`).join(',\n')
}

/** `'admin', 'user', 'viewer', …`: el VALUES del VO y el CHECK de la migración. */
export function roleValuesList(roles: RoleDefinition[]): string {
  return [...BUILT_IN, ...roles.map(r => r.name)].map(value => `'${value}'`).join(', ')
}

/** `'admin' | 'user' | 'viewer' | …`: la union `UserRoleValue` de auth-types. */
export function roleValuesUnion(roles: RoleDefinition[]): string {
  return [...BUILT_IN, ...roles.map(r => r.name)].map(value => `'${value}'`).join(' | ')
}

/** Entradas EXTRA de SEED_USERS (una por rol, para probar los accesos en local). */
export function roleSeedEntries(roles: RoleDefinition[]): string {
  return roles
    .map(role => `,\n  { email: '${role.name}@app.local', name: '${role.label} Local', role: '${role.name}' }`)
    .join('')
}

/** Entradas EXTRA de USER_ROLE_LABELS (pantalla IAM). */
export function roleLabelEntries(roles: RoleDefinition[]): string {
  return roles.map(role => `,\n  [UserRoleEnum.${roleConstantName(role.name)}]: '${role.label}'`).join('')
}

/** Entradas EXTRA de USER_ROLE_VARIANTS: sin selector de color, todos outline (YAGNI). */
export function roleVariantEntries(roles: RoleDefinition[]): string {
  return roles.map(role => `,\n  '${role.name}': 'outline'`).join('')
}
