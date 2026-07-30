import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { CurrentUserDto } from '@app/shared/domain'

// Reads the authenticated user that the IAM SessionGuard populates on request.user.
// Typed against the shared CurrentUserDto so business controllers stay free of IAM imports.
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): CurrentUserDto => {
  const request = context.switchToHttp().getRequest<{ user: CurrentUserDto }>()
  return request.user
})
