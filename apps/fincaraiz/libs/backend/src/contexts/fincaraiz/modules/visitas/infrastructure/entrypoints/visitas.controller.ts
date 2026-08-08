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
import { ExportVisitasHandler } from '../../application/handlers/export-visitas.handler'
import { GetVisitaHandler } from '../../application/handlers/get-visita.handler'
import { RegisterVisitaHandler } from '../../application/handlers/register-visita.handler'
import { RemoveVisitaHandler } from '../../application/handlers/remove-visita.handler'
import { SearchVisitasHandler } from '../../application/handlers/search-visitas.handler'
import { UpdateVisitaHandler } from '../../application/handlers/update-visita.handler'
import { VisitaPrimitiveProps, VisitaUpdateProps } from '../../domain/visita-types'
import { ExportVisitasQueryDto } from './dtos/export-visitas-query.dto'
import { VISITA_EXPORT_COLUMNS } from './visitas-export-columns'
import { RegisterVisitaDto } from './dtos/register-visita.dto'
import { UpdateVisitaDto } from './dtos/update-visita.dto'

@Controller('visitas')
export class VisitasController {
  constructor(
    private readonly registerVisitaHandler: RegisterVisitaHandler,
    private readonly searchVisitasHandler: SearchVisitasHandler,
    private readonly getVisitaHandler: GetVisitaHandler,
    private readonly updateVisitaHandler: UpdateVisitaHandler,
    private readonly removeVisitaHandler: RemoveVisitaHandler,
    private readonly exportVisitasHandler: ExportVisitasHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterVisitaDto): Promise<void> {
    return this.registerVisitaHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<VisitaPrimitiveProps>> {
    return this.searchVisitasHandler.handle(query)
  }

  // Exports the full filtered visita set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportVisitasQueryDto): Promise<StreamableFile> {
    const rows = await this.exportVisitasHandler.handle(query)
    return buildExportFile(rows, VISITA_EXPORT_COLUMNS, query.format, 'visitas')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<VisitaPrimitiveProps> {
    return this.getVisitaHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateVisitaDto): Promise<void> {
    return this.updateVisitaHandler.handle({ id, updates: body as VisitaUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeVisitaHandler.handle({ id })
  }
}
