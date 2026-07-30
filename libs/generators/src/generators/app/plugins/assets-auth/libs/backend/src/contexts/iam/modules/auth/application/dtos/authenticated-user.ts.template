import { UserRoleValue } from '../../domain/auth-types'
import { User } from '../../domain/user'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: UserRoleValue
}

export const toAuthenticatedUser = (user: User): AuthenticatedUser => ({
  id: user.id.value,
  email: user.email.value,
  name: user.name.value,
  role: user.role.value as UserRoleValue
})
