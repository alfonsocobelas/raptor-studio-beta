import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, StreamableFile } from '@nestjs/common'
import { UserRoleEnum } from '@sap-licenses/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { buildExportFile } from '../../../../../shared/infrastructure/export/build-export-file'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ExportCustomersHandler } from '../../application/handlers/export-customers.handler'
import { GetCustomerHandler } from '../../application/handlers/get-customer.handler'
import { RegisterCustomerHandler } from '../../application/handlers/register-customer.handler'
import { AggregateCustomersHandler } from '../../application/handlers/aggregate-customers.handler'
import { SearchCustomersHandler } from '../../application/handlers/search-customers.handler'
import { UpdateCustomerHandler } from '../../application/handlers/update-customer.handler'
import { CustomerDetailOutput } from '../../application/use-cases/get-customer-usecase.service'
import { CustomerPrimitiveProps, CustomerUpdateProps } from '../../domain/customer-types'
import { AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateCustomersQueryDto } from './dtos/aggregate-customers-query.dto'
import { ExportCustomersQueryDto } from './dtos/export-customers-query.dto'
import { CUSTOMER_EXPORT_COLUMNS } from './customers-export-columns'
import { RegisterCustomerDto } from './dtos/register-customer.dto'
import { UpdateCustomerDto } from './dtos/update-customer.dto'

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly registerCustomerHandler: RegisterCustomerHandler,
    private readonly searchCustomersHandler: SearchCustomersHandler,
    private readonly aggregateCustomersHandler: AggregateCustomersHandler,
    private readonly getCustomerHandler: GetCustomerHandler,
    private readonly updateCustomerHandler: UpdateCustomerHandler,
    private readonly exportCustomersHandler: ExportCustomersHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterCustomerDto): Promise<void> {
    return this.registerCustomerHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<CustomerPrimitiveProps>> {
    return this.searchCustomersHandler.handle(query)
  }

  // Una agregación del conjunto filtrado (spec 71). Declarado antes de `:id`, o 'aggregate' se
  // leería como un uuid. Mismos roles que el listado: agregar es leer, no una capacidad nueva.
  @Get('aggregate')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  aggregate(@Query(new ParseCriteriaPipe()) query: AggregateCustomersQueryDto): Promise<AggregateOutput> {
    return this.aggregateCustomersHandler.handle(query)
  }

  // Exports the full filtered customer set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportCustomersQueryDto): Promise<StreamableFile> {
    const rows = await this.exportCustomersHandler.handle(query)
    return buildExportFile(rows, CUSTOMER_EXPORT_COLUMNS, query.format, 'clientes')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<CustomerDetailOutput> {
    return this.getCustomerHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateCustomerDto): Promise<void> {
    return this.updateCustomerHandler.handle({ id, updates: body as CustomerUpdateProps })
  }
}
