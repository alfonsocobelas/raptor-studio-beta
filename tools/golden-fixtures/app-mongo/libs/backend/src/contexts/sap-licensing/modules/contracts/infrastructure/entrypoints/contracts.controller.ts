import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, StreamableFile } from '@nestjs/common'
import { UserRoleEnum } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { buildExportFile } from '../../../../../shared/infrastructure/export/build-export-file'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ExportContractsHandler } from '../../application/handlers/export-contracts.handler'
import { GetContractHandler } from '../../application/handlers/get-contract.handler'
import { RegisterContractHandler } from '../../application/handlers/register-contract.handler'
import { SearchContractsHandler } from '../../application/handlers/search-contracts.handler'
import { UpdateContractHandler } from '../../application/handlers/update-contract.handler'
import { ContractPrimitiveProps, ContractUpdateProps } from '../../domain/contract-types'
import { ExportContractsQueryDto } from './dtos/export-contracts-query.dto'
import { CONTRACT_EXPORT_COLUMNS } from './contracts-export-columns'
import { RegisterContractDto } from './dtos/register-contract.dto'
import { UpdateContractDto } from './dtos/update-contract.dto'

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly registerContractHandler: RegisterContractHandler,
    private readonly searchContractsHandler: SearchContractsHandler,
    private readonly getContractHandler: GetContractHandler,
    private readonly updateContractHandler: UpdateContractHandler,
    private readonly exportContractsHandler: ExportContractsHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterContractDto): Promise<void> {
    return this.registerContractHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<ContractPrimitiveProps>> {
    return this.searchContractsHandler.handle(query)
  }

  // Exports the full filtered contract set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportContractsQueryDto): Promise<StreamableFile> {
    const rows = await this.exportContractsHandler.handle(query)
    return buildExportFile(rows, CONTRACT_EXPORT_COLUMNS, query.format, 'contratos')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ContractPrimitiveProps> {
    return this.getContractHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateContractDto): Promise<void> {
    return this.updateContractHandler.handle({ id, updates: body as ContractUpdateProps })
  }
}
