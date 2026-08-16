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
import { ExportMuestrasHandler } from '../../application/handlers/export-muestras.handler'
import { GetMuestraHandler } from '../../application/handlers/get-muestra.handler'
import { RegisterMuestraHandler } from '../../application/handlers/register-muestra.handler'
import { RemoveMuestraHandler } from '../../application/handlers/remove-muestra.handler'
import { RestoreMuestraHandler } from '../../application/handlers/restore-muestra.handler'
import { SearchDeletedMuestrasHandler } from '../../application/handlers/search-deleted-muestras.handler'
import { SearchMuestrasHandler } from '../../application/handlers/search-muestras.handler'
import { UpdateMuestraHandler } from '../../application/handlers/update-muestra.handler'
import { MuestraPrimitiveProps, MuestraUpdateProps } from '../../domain/muestra-types'
import { ExportMuestrasQueryDto } from './dtos/export-muestras-query.dto'
import { MUESTRA_EXPORT_COLUMNS } from './muestras-export-columns'
import { RegisterMuestraDto } from './dtos/register-muestra.dto'
import { UpdateMuestraDto } from './dtos/update-muestra.dto'

@Controller('muestras')
export class MuestrasController {
  constructor(
    private readonly registerMuestraHandler: RegisterMuestraHandler,
    private readonly searchMuestrasHandler: SearchMuestrasHandler,
    private readonly getMuestraHandler: GetMuestraHandler,
    private readonly updateMuestraHandler: UpdateMuestraHandler,
    private readonly removeMuestraHandler: RemoveMuestraHandler,
    private readonly searchDeletedMuestrasHandler: SearchDeletedMuestrasHandler,
    private readonly restoreMuestraHandler: RestoreMuestraHandler,
    private readonly exportMuestrasHandler: ExportMuestrasHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterMuestraDto): Promise<void> {
    return this.registerMuestraHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<MuestraPrimitiveProps>> {
    return this.searchMuestrasHandler.handle(query)
  }

  // Exports the full filtered muestra set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportMuestrasQueryDto): Promise<StreamableFile> {
    const rows = await this.exportMuestrasHandler.handle(query)
    return buildExportFile(rows, MUESTRA_EXPORT_COLUMNS, query.format, 'muestras')
  }

  // La papelera: el mismo search sobre lo soft-borrado. Declarada antes de `:id`.
  @Get('deleted')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  searchDeleted(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<MuestraPrimitiveProps>> {
    return this.searchDeletedMuestrasHandler.handle(query)
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<MuestraPrimitiveProps> {
    return this.getMuestraHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateMuestraDto): Promise<void> {
    return this.updateMuestraHandler.handle({ id, updates: body as MuestraUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeMuestraHandler.handle({ id })
  }

  @Post(':id/restore')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  restore(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.restoreMuestraHandler.handle({ id })
  }
}
