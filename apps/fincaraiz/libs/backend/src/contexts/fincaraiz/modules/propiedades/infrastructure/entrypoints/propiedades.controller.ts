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
import { ExportPropiedadesHandler } from '../../application/handlers/export-propiedades.handler'
import { GetPropiedadHandler } from '../../application/handlers/get-propiedad.handler'
import { RegisterPropiedadHandler } from '../../application/handlers/register-propiedad.handler'
import { RemovePropiedadHandler } from '../../application/handlers/remove-propiedad.handler'
import { SearchPropiedadesHandler } from '../../application/handlers/search-propiedades.handler'
import { UpdatePropiedadHandler } from '../../application/handlers/update-propiedad.handler'
import { PropiedadPrimitiveProps, PropiedadUpdateProps } from '../../domain/propiedad-types'
import { ExportPropiedadesQueryDto } from './dtos/export-propiedades-query.dto'
import { PROPIEDAD_EXPORT_COLUMNS } from './propiedades-export-columns'
import { RegisterPropiedadDto } from './dtos/register-propiedad.dto'
import { UpdatePropiedadDto } from './dtos/update-propiedad.dto'

@Controller('propiedades')
export class PropiedadesController {
  constructor(
    private readonly registerPropiedadHandler: RegisterPropiedadHandler,
    private readonly searchPropiedadesHandler: SearchPropiedadesHandler,
    private readonly getPropiedadHandler: GetPropiedadHandler,
    private readonly updatePropiedadHandler: UpdatePropiedadHandler,
    private readonly removePropiedadHandler: RemovePropiedadHandler,
    private readonly exportPropiedadesHandler: ExportPropiedadesHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterPropiedadDto): Promise<void> {
    return this.registerPropiedadHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<PropiedadPrimitiveProps>> {
    return this.searchPropiedadesHandler.handle(query)
  }

  // Exports the full filtered propiedad set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportPropiedadesQueryDto): Promise<StreamableFile> {
    const rows = await this.exportPropiedadesHandler.handle(query)
    return buildExportFile(rows, PROPIEDAD_EXPORT_COLUMNS, query.format, 'propiedades')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<PropiedadPrimitiveProps> {
    return this.getPropiedadHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdatePropiedadDto): Promise<void> {
    return this.updatePropiedadHandler.handle({ id, updates: body as PropiedadUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removePropiedadHandler.handle({ id })
  }
}
