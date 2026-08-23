// GENERADO por apps/studio/tools/emit-system-preview.ts — NO EDITAR (spec 57)
// Fuente: plugins/assets-auth/libs/frontend/src/domains/iam/iam-labels.ts.template
import { UserRoleEnum, UserStatusEnum } from '@app/shared/domain'

// Etiquetas de presentación en español; los valores de dominio/API se mantienen en inglés.
export const USER_ROLE_LABELS: Record<UserRoleEnum, string> = {
  [UserRoleEnum.ADMIN]: 'Administrador',
  [UserRoleEnum.USER]: 'Usuario',
  [UserRoleEnum.VIEWER]: 'Auditor'
}

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export const USER_ROLE_VARIANTS: Record<string, BadgeVariant> = {
  admin: 'default',
  user: 'secondary',
  viewer: 'outline'
}

export const USER_STATUS_LABELS: Record<UserStatusEnum, string> = {
  [UserStatusEnum.ACTIVE]: 'Activo',
  [UserStatusEnum.PENDING]: 'Pendiente',
  [UserStatusEnum.DISABLED]: 'Desactivado'
}

export const USER_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: 'default',
  pending: 'outline',
  disabled: 'secondary'
}
