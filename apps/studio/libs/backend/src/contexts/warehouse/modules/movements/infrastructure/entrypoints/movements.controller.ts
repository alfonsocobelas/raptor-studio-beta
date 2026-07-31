import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  StreamableFile
} from '@nestjs/common'
import { UserRoleEnum } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { buildExportFile } from '../../../../../shared/infrastructure/export/build-export-file'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ExportMovementsHandler } from '../../application/handlers/export-movements.handler'
import { GetMovementHandler } from '../../application/handlers/get-movement.handler'
import { RegisterMovementHandler } from '../../application/handlers/register-movement.handler'
import { RemoveMovementHandler } from '../../application/handlers/remove-movement.handler'
import { SearchMovementsHandler } from '../../application/handlers/search-movements.handler'
import { UpdateMovementHandler } from '../../application/handlers/update-movement.handler'
import { MovementPrimitiveProps, MovementUpdateProps } from '../../domain/movement-types'
import { ExportMovementsQueryDto } from './dtos/export-movements-query.dto'
import { MOVEMENT_EXPORT_COLUMNS } from './movements-export-columns'
import { RegisterMovementDto } from './dtos/register-movement.dto'
import { UpdateMovementDto } from './dtos/update-movement.dto'

@Controller('movements')
export class MovementsController {
  constructor(
    private readonly registerMovementHandler: RegisterMovementHandler,
    private readonly searchMovementsHandler: SearchMovementsHandler,
    private readonly getMovementHandler: GetMovementHandler,
    private readonly updateMovementHandler: UpdateMovementHandler,
    private readonly removeMovementHandler: RemoveMovementHandler,
    private readonly exportMovementsHandler: ExportMovementsHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterMovementDto): Promise<void> {
    return this.registerMovementHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<MovementPrimitiveProps>> {
    return this.searchMovementsHandler.handle(query)
  }

  // Exports the full filtered movement set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportMovementsQueryDto): Promise<StreamableFile> {
    const rows = await this.exportMovementsHandler.handle(query)
    return buildExportFile(rows, MOVEMENT_EXPORT_COLUMNS, query.format, 'movimientos')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<MovementPrimitiveProps> {
    return this.getMovementHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateMovementDto): Promise<void> {
    return this.updateMovementHandler.handle({ id, updates: body as MovementUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeMovementHandler.handle({ id })
  }
}
