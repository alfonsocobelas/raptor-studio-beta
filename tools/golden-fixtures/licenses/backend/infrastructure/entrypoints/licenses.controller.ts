import { Controller, Get, Param, Query, StreamableFile } from '@nestjs/common'
import { UserRoleEnum } from '@sap-licenses/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { buildExportFile } from '../../../../../shared/infrastructure/export/build-export-file'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ExportLicensesHandler } from '../../application/handlers/export-licenses.handler'
import { GetLicenseHandler } from '../../application/handlers/get-license.handler'
import { SearchLicensesHandler } from '../../application/handlers/search-licenses.handler'
import { LicensePrimitiveProps } from '../../domain/license-types'
import { ExportLicensesQueryDto } from './dtos/export-licenses-query.dto'
import { LICENSE_EXPORT_COLUMNS } from './licenses-export-columns'

@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly searchLicensesHandler: SearchLicensesHandler,
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
