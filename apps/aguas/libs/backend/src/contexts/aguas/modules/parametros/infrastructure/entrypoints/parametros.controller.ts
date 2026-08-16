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
import { ExportParametrosHandler } from '../../application/handlers/export-parametros.handler'
import { GetParametroHandler } from '../../application/handlers/get-parametro.handler'
import { RegisterParametroHandler } from '../../application/handlers/register-parametro.handler'
import { RemoveParametroHandler } from '../../application/handlers/remove-parametro.handler'
import { RestoreParametroHandler } from '../../application/handlers/restore-parametro.handler'
import { SearchDeletedParametrosHandler } from '../../application/handlers/search-deleted-parametros.handler'
import { SearchParametrosHandler } from '../../application/handlers/search-parametros.handler'
import { UpdateParametroHandler } from '../../application/handlers/update-parametro.handler'
import { ParametroPrimitiveProps, ParametroUpdateProps } from '../../domain/parametro-types'
import { ExportParametrosQueryDto } from './dtos/export-parametros-query.dto'
import { PARAMETRO_EXPORT_COLUMNS } from './parametros-export-columns'
import { RegisterParametroDto } from './dtos/register-parametro.dto'
import { UpdateParametroDto } from './dtos/update-parametro.dto'

@Controller('parametros')
export class ParametrosController {
  constructor(
    private readonly registerParametroHandler: RegisterParametroHandler,
    private readonly searchParametrosHandler: SearchParametrosHandler,
    private readonly getParametroHandler: GetParametroHandler,
    private readonly updateParametroHandler: UpdateParametroHandler,
    private readonly removeParametroHandler: RemoveParametroHandler,
    private readonly searchDeletedParametrosHandler: SearchDeletedParametrosHandler,
    private readonly restoreParametroHandler: RestoreParametroHandler,
    private readonly exportParametrosHandler: ExportParametrosHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterParametroDto): Promise<void> {
    return this.registerParametroHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<ParametroPrimitiveProps>> {
    return this.searchParametrosHandler.handle(query)
  }

  // Exports the full filtered parametro set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportParametrosQueryDto): Promise<StreamableFile> {
    const rows = await this.exportParametrosHandler.handle(query)
    return buildExportFile(rows, PARAMETRO_EXPORT_COLUMNS, query.format, 'parámetros')
  }

  // La papelera: el mismo search sobre lo soft-borrado. Declarada antes de `:id`.
  @Get('deleted')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  searchDeleted(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<ParametroPrimitiveProps>> {
    return this.searchDeletedParametrosHandler.handle(query)
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ParametroPrimitiveProps> {
    return this.getParametroHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateParametroDto): Promise<void> {
    return this.updateParametroHandler.handle({ id, updates: body as ParametroUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeParametroHandler.handle({ id })
  }

  @Post(':id/restore')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  restore(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.restoreParametroHandler.handle({ id })
  }
}
