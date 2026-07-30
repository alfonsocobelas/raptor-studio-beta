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
import { ExportSalesHandler } from '../../application/handlers/export-sales.handler'
import { GetSaleHandler } from '../../application/handlers/get-sale.handler'
import { RegisterSaleHandler } from '../../application/handlers/register-sale.handler'
import { RemoveSaleHandler } from '../../application/handlers/remove-sale.handler'
import { SearchSalesHandler } from '../../application/handlers/search-sales.handler'
import { UpdateSaleHandler } from '../../application/handlers/update-sale.handler'
import { SalePrimitiveProps, SaleUpdateProps } from '../../domain/sale-types'
import { ExportSalesQueryDto } from './dtos/export-sales-query.dto'
import { SALE_EXPORT_COLUMNS } from './sales-export-columns'
import { RegisterSaleDto } from './dtos/register-sale.dto'
import { UpdateSaleDto } from './dtos/update-sale.dto'

@Controller('sales')
export class SalesController {
  constructor(
    private readonly registerSaleHandler: RegisterSaleHandler,
    private readonly searchSalesHandler: SearchSalesHandler,
    private readonly getSaleHandler: GetSaleHandler,
    private readonly updateSaleHandler: UpdateSaleHandler,
    private readonly removeSaleHandler: RemoveSaleHandler,
    private readonly exportSalesHandler: ExportSalesHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterSaleDto): Promise<void> {
    return this.registerSaleHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(@Query(new ParseCriteriaPipe()) query: PaginateOffsetDto): Promise<OffsetPaginatedOutput<SalePrimitiveProps>> {
    return this.searchSalesHandler.handle(query)
  }

  // Exports the full filtered sale set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportSalesQueryDto): Promise<StreamableFile> {
    const rows = await this.exportSalesHandler.handle(query)
    return buildExportFile(rows, SALE_EXPORT_COLUMNS, query.format, 'ventas')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<SalePrimitiveProps> {
    return this.getSaleHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateSaleDto): Promise<void> {
    return this.updateSaleHandler.handle({ id, updates: body as SaleUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeSaleHandler.handle({ id })
  }
}
