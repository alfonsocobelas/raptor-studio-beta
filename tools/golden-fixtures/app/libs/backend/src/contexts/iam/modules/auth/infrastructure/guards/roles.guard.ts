import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import { UserRoleValue } from '../../domain/auth-types'
import { ROLES_KEY } from '../../../../../shared/infrastructure/auth/auth-metadata.constants'

interface RequestWithUser {
  user?: { role: UserRoleValue }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleValue[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenError('Insufficient role')
    }
    return true
  }
}
