import { UserPrimitiveProps } from '../../domain/auth-types'

type UserAllowedField = keyof UserPrimitiveProps

const USER_ALLOWED_FILTERS: Array<UserAllowedField> = ['email', 'name', 'role', 'status'] as const

const USER_ALLOWED_ORDERS: Array<UserAllowedField> = ['email', 'name', 'role', 'status', 'createdAt'] as const

const searchUsersConfig = {
  allowedFilters: USER_ALLOWED_FILTERS,
  allowedOrders: USER_ALLOWED_ORDERS
} as const

export default searchUsersConfig
