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
import { ExportSuppliersHandler } from '../../application/handlers/export-suppliers.handler'
import { GetSupplierHandler } from '../../application/handlers/get-supplier.handler'
import { RegisterSupplierHandler } from '../../application/handlers/register-supplier.handler'
import { RemoveSupplierHandler } from '../../application/handlers/remove-supplier.handler'
import { SearchSuppliersHandler } from '../../application/handlers/search-suppliers.handler'
import { UpdateSupplierHandler } from '../../application/handlers/update-supplier.handler'
import { SupplierPrimitiveProps, SupplierUpdateProps } from '../../domain/supplier-types'
import { ExportSuppliersQueryDto } from './dtos/export-suppliers-query.dto'
import { SUPPLIER_EXPORT_COLUMNS } from './suppliers-export-columns'
import { RegisterSupplierDto } from './dtos/register-supplier.dto'
import { UpdateSupplierDto } from './dtos/update-supplier.dto'

@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly registerSupplierHandler: RegisterSupplierHandler,
    private readonly searchSuppliersHandler: SearchSuppliersHandler,
    private readonly getSupplierHandler: GetSupplierHandler,
    private readonly updateSupplierHandler: UpdateSupplierHandler,
    private readonly removeSupplierHandler: RemoveSupplierHandler,
    private readonly exportSuppliersHandler: ExportSuppliersHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterSupplierDto): Promise<void> {
    return this.registerSupplierHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<SupplierPrimitiveProps>> {
    return this.searchSuppliersHandler.handle(query)
  }

  // Exports the full filtered supplier set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportSuppliersQueryDto): Promise<StreamableFile> {
    const rows = await this.exportSuppliersHandler.handle(query)
    return buildExportFile(rows, SUPPLIER_EXPORT_COLUMNS, query.format, 'proveedores')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<SupplierPrimitiveProps> {
    return this.getSupplierHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateSupplierDto): Promise<void> {
    return this.updateSupplierHandler.handle({ id, updates: body as SupplierUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeSupplierHandler.handle({ id })
  }
}
