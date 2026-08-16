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
import { ExportPuntosHandler } from '../../application/handlers/export-puntos.handler'
import { GetPuntoHandler } from '../../application/handlers/get-punto.handler'
import { RegisterPuntoHandler } from '../../application/handlers/register-punto.handler'
import { RemovePuntoHandler } from '../../application/handlers/remove-punto.handler'
import { RestorePuntoHandler } from '../../application/handlers/restore-punto.handler'
import { SearchDeletedPuntosHandler } from '../../application/handlers/search-deleted-puntos.handler'
import { SearchPuntosHandler } from '../../application/handlers/search-puntos.handler'
import { UpdatePuntoHandler } from '../../application/handlers/update-punto.handler'
import { PuntoPrimitiveProps, PuntoUpdateProps } from '../../domain/punto-types'
import { ExportPuntosQueryDto } from './dtos/export-puntos-query.dto'
import { PUNTO_EXPORT_COLUMNS } from './puntos-export-columns'
import { RegisterPuntoDto } from './dtos/register-punto.dto'
import { UpdatePuntoDto } from './dtos/update-punto.dto'

@Controller('puntos')
export class PuntosController {
  constructor(
    private readonly registerPuntoHandler: RegisterPuntoHandler,
    private readonly searchPuntosHandler: SearchPuntosHandler,
    private readonly getPuntoHandler: GetPuntoHandler,
    private readonly updatePuntoHandler: UpdatePuntoHandler,
    private readonly removePuntoHandler: RemovePuntoHandler,
    private readonly searchDeletedPuntosHandler: SearchDeletedPuntosHandler,
    private readonly restorePuntoHandler: RestorePuntoHandler,
    private readonly exportPuntosHandler: ExportPuntosHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterPuntoDto): Promise<void> {
    return this.registerPuntoHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<PuntoPrimitiveProps>> {
    return this.searchPuntosHandler.handle(query)
  }

  // Exports the full filtered punto set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportPuntosQueryDto): Promise<StreamableFile> {
    const rows = await this.exportPuntosHandler.handle(query)
    return buildExportFile(rows, PUNTO_EXPORT_COLUMNS, query.format, 'puntos de muestreo')
  }

  // La papelera: el mismo search sobre lo soft-borrado. Declarada antes de `:id`.
  @Get('deleted')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  searchDeleted(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<PuntoPrimitiveProps>> {
    return this.searchDeletedPuntosHandler.handle(query)
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<PuntoPrimitiveProps> {
    return this.getPuntoHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdatePuntoDto): Promise<void> {
    return this.updatePuntoHandler.handle({ id, updates: body as PuntoUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removePuntoHandler.handle({ id })
  }

  @Post(':id/restore')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  restore(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.restorePuntoHandler.handle({ id })
  }
}
