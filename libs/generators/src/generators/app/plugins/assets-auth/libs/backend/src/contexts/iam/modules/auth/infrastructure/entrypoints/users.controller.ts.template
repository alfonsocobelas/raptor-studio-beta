import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common'
import { UserDto, UserRoleEnum, UserStatusEnum } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { UserPrimitiveProps } from '../../domain/auth-types'
import { ChangeUserRoleHandler } from '../../application/handlers/change-user-role.handler'
import { DisableUserHandler } from '../../application/handlers/disable-user.handler'
import { ReactivateUserHandler } from '../../application/handlers/reactivate-user.handler'
import { SearchUsersHandler } from '../../application/handlers/search-users.handler'
import { AuthenticatedUser } from '../../application/dtos/authenticated-user'
import { CurrentUser } from '../../../../../shared/infrastructure/auth/current-user.decorator'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ChangeUserRoleHttpDto } from './dtos/users-request.dtos'

@Controller('users')
@Roles(UserRoleEnum.ADMIN)
export class UsersController {
  constructor(
    private readonly searchUsersHandler: SearchUsersHandler,
    private readonly changeUserRoleHandler: ChangeUserRoleHandler,
    private readonly disableUserHandler: DisableUserHandler,
    private readonly reactivateUserHandler: ReactivateUserHandler
  ) {}

  @Get()
  async search(@Query(new ParseCriteriaPipe()) query: PaginateOffsetDto): Promise<OffsetPaginatedOutput<UserDto>> {
    const result = await this.searchUsersHandler.handle(query)
    return { ...result, items: result.items.map(this.toUserDto) }
  }

  @Put(':id/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeRole(
    @Param('id') id: string,
    @Body() body: ChangeUserRoleHttpDto,
    @CurrentUser() actingUser: AuthenticatedUser
  ): Promise<void> {
    return this.changeUserRoleHandler.handle({ actingUserId: actingUser.id, targetUserId: id, role: body.role })
  }

  @Post(':id/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  disable(@Param('id') id: string, @CurrentUser() actingUser: AuthenticatedUser): Promise<void> {
    return this.disableUserHandler.handle({ actingUserId: actingUser.id, targetUserId: id })
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  reactivate(@Param('id') id: string): Promise<void> {
    return this.reactivateUserHandler.handle({ targetUserId: id })
  }

  private toUserDto(user: UserPrimitiveProps): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRoleEnum,
      status: user.status as UserStatusEnum,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString()
    }
  }
}
