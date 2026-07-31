import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UnauthorizedError } from '../../../../../shared/domain/errors'
import { ResolveSessionUseCase } from '../../application/use-cases/resolve-session-usecase.service'
import { IS_PUBLIC_KEY } from '../../../../../shared/infrastructure/auth/auth-metadata.constants'
import { SESSION_COOKIE_NAME } from '../auth.constants'

interface RequestWithSession {
  cookies?: Record<string, string>
  user?: unknown
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolveSession: ResolveSessionUseCase
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithSession>()
    const token = request.cookies?.[SESSION_COOKIE_NAME]
    if (!token) {
      throw new UnauthorizedError('Authentication required')
    }

    const user = await this.resolveSession.invoke({ sessionToken: token })
    if (!user) {
      throw new UnauthorizedError('Authentication required')
    }

    request.user = user
    return true
  }
}
