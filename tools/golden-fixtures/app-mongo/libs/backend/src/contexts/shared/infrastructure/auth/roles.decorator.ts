import { SetMetadata } from '@nestjs/common'
import { UserRoleEnum } from '@app/shared/domain'
import { ROLES_KEY } from './auth-metadata.constants'

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(ROLES_KEY, roles)
