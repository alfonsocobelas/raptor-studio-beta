import { UserRoleEnum, UserStatusEnum } from './auth-enums'

export interface UserDto {
  id: string
  email: string
  name: string
  role: UserRoleEnum
  status: UserStatusEnum
  createdAt: string
  updatedAt: string
}
