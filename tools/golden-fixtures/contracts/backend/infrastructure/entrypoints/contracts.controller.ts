import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, StreamableFile } from '@nestjs/common'
import { UserRoleEnum } from '@sap-licenses/shared/domain'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { buildExportFile } from '../../../../../shared/infrastructure/export/build-export-file'
import { PaginateOffsetDto } from '../../../../../shared/infrastructure/dtos/paginate-offset.dto'
import { ParseCriteriaPipe } from '../../../../../shared/infrastructure/pipes/parse-criteria.pipe'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { Roles } from '../../../../../shared/infrastructure/auth/roles.decorator'
import { ExportContractsHandler } from '../../application/handlers/export-contracts.handler'
import { GetContractHandler } from '../../application/handlers/get-contract.handler'
import { RegisterContractHandler } from '../../application/handlers/register-contract.handler'
import { AggregateContractsHandler } from '../../application/handlers/aggregate-contracts.handler'
import { SearchContractsHandler } from '../../application/handlers/search-contracts.handler'
import { TerminateContractHandler } from '../../application/handlers/terminate-contract.handler'
import { ExpireContractHandler } from '../../application/handlers/expire-contract.handler'
import { UpdateContractHandler } from '../../application/handlers/update-contract.handler'
import { ContractPrimitiveProps, ContractUpdateProps } from '../../domain/contract-types'
import { AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateContractsQueryDto } from './dtos/aggregate-contracts-query.dto'
import { ExportContractsQueryDto } from './dtos/export-contracts-query.dto'
import { CONTRACT_EXPORT_COLUMNS } from './contracts-export-columns'
import { RegisterContractDto } from './dtos/register-contract.dto'
import { UpdateContractDto } from './dtos/update-contract.dto'

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly registerContractHandler: RegisterContractHandler,
    private readonly searchContractsHandler: SearchContractsHandler,
    private readonly aggregateContractsHandler: AggregateContractsHandler,
    private readonly getContractHandler: GetContractHandler,
    private readonly updateContractHandler: UpdateContractHandler,
    private readonly terminateContractHandler: TerminateContractHandler,
    private readonly expireContractHandler: ExpireContractHandler,
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

  // Una agregación del conjunto filtrado (spec 71). Declarado antes de `:id`, o 'aggregate' se
  // leería como un uuid. Mismos roles que el listado: agregar es leer, no una capacidad nueva.
  @Get('aggregate')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  aggregate(@Query(new ParseCriteriaPipe()) query: AggregateContractsQueryDto): Promise<AggregateOutput> {
    return this.aggregateContractsHandler.handle(query)
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
    const { version, ...updates } = body
    return this.updateContractHandler.handle({ id, version, updates: updates as ContractUpdateProps })
  }

  /** Transición «Terminar» de la máquina de estados (spec 43): 409 si el estado la rechaza. */
  @Post(':id/terminate')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  terminate(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.terminateContractHandler.handle({ id })
  }

  /** Transición «Expirar» de la máquina de estados (spec 43): 409 si el estado la rechaza. */
  @Post(':id/expire')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  expire(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.expireContractHandler.handle({ id })
  }
}
