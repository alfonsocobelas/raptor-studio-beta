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
import { ExportGarmentsHandler } from '../../application/handlers/export-garments.handler'
import { GetGarmentHandler } from '../../application/handlers/get-garment.handler'
import { RegisterGarmentHandler } from '../../application/handlers/register-garment.handler'
import { RemoveGarmentHandler } from '../../application/handlers/remove-garment.handler'
import { SearchGarmentsHandler } from '../../application/handlers/search-garments.handler'
import { UpdateGarmentHandler } from '../../application/handlers/update-garment.handler'
import { GarmentPrimitiveProps, GarmentUpdateProps } from '../../domain/garment-types'
import { ExportGarmentsQueryDto } from './dtos/export-garments-query.dto'
import { GARMENT_EXPORT_COLUMNS } from './garments-export-columns'
import { RegisterGarmentDto } from './dtos/register-garment.dto'
import { UpdateGarmentDto } from './dtos/update-garment.dto'

@Controller('garments')
export class GarmentsController {
  constructor(
    private readonly registerGarmentHandler: RegisterGarmentHandler,
    private readonly searchGarmentsHandler: SearchGarmentsHandler,
    private readonly getGarmentHandler: GetGarmentHandler,
    private readonly updateGarmentHandler: UpdateGarmentHandler,
    private readonly removeGarmentHandler: RemoveGarmentHandler,
    private readonly exportGarmentsHandler: ExportGarmentsHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterGarmentDto): Promise<void> {
    return this.registerGarmentHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<GarmentPrimitiveProps>> {
    return this.searchGarmentsHandler.handle(query)
  }

  // Exports the full filtered garment set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportGarmentsQueryDto): Promise<StreamableFile> {
    const rows = await this.exportGarmentsHandler.handle(query)
    return buildExportFile(rows, GARMENT_EXPORT_COLUMNS, query.format, 'prendas')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<GarmentPrimitiveProps> {
    return this.getGarmentHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateGarmentDto): Promise<void> {
    return this.updateGarmentHandler.handle({ id, updates: body as GarmentUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeGarmentHandler.handle({ id })
  }
}
