import { UserRoleEnum } from './auth-enums'

export interface CurrentUserDto {
  id: string
  email: string
  name: string
  role: UserRoleEnum
}
