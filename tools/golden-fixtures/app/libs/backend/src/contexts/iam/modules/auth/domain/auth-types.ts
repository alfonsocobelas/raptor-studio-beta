import { Nullable } from '../../../../shared/domain/types'

export type UserRoleValue = 'admin' | 'user' | 'viewer'
export type UserStatusValue = 'pending' | 'active' | 'disabled'
export type AuthTokenTypeValue = 'invitation' | 'password_reset'

export interface UserPrimitiveProps {
  id: string
  email: string
  name: string
  passwordHash: Nullable<string>
  role: UserRoleValue
  status: UserStatusValue
  failedLoginAttempts: number
  lockedUntil: Nullable<Date>
  createdAt: Date
  updatedAt: Date
}

export interface SessionPrimitiveProps {
  id: string
  userId: string
  tokenHash: string
  createdAt: Date
  expiresAt: Date
  lastSeenAt: Date
}

export interface AuthTokenPrimitiveProps {
  id: string
  userId: string
  tokenHash: string
  type: AuthTokenTypeValue
  expiresAt: Date
  usedAt: Nullable<Date>
  createdAt: Date
}
