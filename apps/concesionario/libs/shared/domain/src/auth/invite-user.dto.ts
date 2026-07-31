import { UserRoleEnum } from './auth-enums'

export interface InviteUserDto {
  email: string
  name: string
  role: UserRoleEnum
}
