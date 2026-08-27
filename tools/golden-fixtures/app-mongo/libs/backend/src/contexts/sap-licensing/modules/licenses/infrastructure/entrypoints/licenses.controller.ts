import { Controller, Get, Param, Query, StreamableFile } from '@nestjs/common'
import { UserRoleEnum } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { buildExportFile } from '../../../../../shared/infrastructure/export/build-export-file'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ExportLicensesHandler } from '../../application/handlers/export-licenses.handler'
import { GetLicenseHandler } from '../../application/handlers/get-license.handler'
import { AggregateLicensesHandler } from '../../application/handlers/aggregate-licenses.handler'
import { SearchLicensesHandler } from '../../application/handlers/search-licenses.handler'
import { LicensePrimitiveProps } from '../../domain/license-types'
import { AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateLicensesQueryDto } from './dtos/aggregate-licenses-query.dto'
import { ExportLicensesQueryDto } from './dtos/export-licenses-query.dto'
import { LICENSE_EXPORT_COLUMNS } from './licenses-export-columns'

@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly searchLicensesHandler: SearchLicensesHandler,
    private readonly aggregateLicensesHandler: AggregateLicensesHandler,
    private readonly getLicenseHandler: GetLicenseHandler,
    private readonly exportLicensesHandler: ExportLicensesHandler
  ) {}

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<LicensePrimitiveProps>> {
    return this.searchLicensesHandler.handle(query)
  }

  // Una agregación del conjunto filtrado (spec 71). Declarado antes de `:id`, o 'aggregate' se
  // leería como un uuid. Mismos roles que el listado: agregar es leer, no una capacidad nueva.
  @Get('aggregate')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  aggregate(@Query(new ParseCriteriaPipe()) query: AggregateLicensesQueryDto): Promise<AggregateOutput> {
    return this.aggregateLicensesHandler.handle(query)
  }

  // Exports the full filtered license set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportLicensesQueryDto): Promise<StreamableFile> {
    const rows = await this.exportLicensesHandler.handle(query)
    return buildExportFile(rows, LICENSE_EXPORT_COLUMNS, query.format, 'licencias')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<LicensePrimitiveProps> {
    return this.getLicenseHandler.handle({ id })
  }
}
