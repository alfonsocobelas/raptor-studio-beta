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
import { ExportClientesHandler } from '../../application/handlers/export-clientes.handler'
import { GetClienteHandler } from '../../application/handlers/get-cliente.handler'
import { RegisterClienteHandler } from '../../application/handlers/register-cliente.handler'
import { RemoveClienteHandler } from '../../application/handlers/remove-cliente.handler'
import { RestoreClienteHandler } from '../../application/handlers/restore-cliente.handler'
import { SearchDeletedClientesHandler } from '../../application/handlers/search-deleted-clientes.handler'
import { SearchClientesHandler } from '../../application/handlers/search-clientes.handler'
import { UpdateClienteHandler } from '../../application/handlers/update-cliente.handler'
import { ClientePrimitiveProps, ClienteUpdateProps } from '../../domain/cliente-types'
import { ExportClientesQueryDto } from './dtos/export-clientes-query.dto'
import { CLIENTE_EXPORT_COLUMNS } from './clientes-export-columns'
import { RegisterClienteDto } from './dtos/register-cliente.dto'
import { UpdateClienteDto } from './dtos/update-cliente.dto'

@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly registerClienteHandler: RegisterClienteHandler,
    private readonly searchClientesHandler: SearchClientesHandler,
    private readonly getClienteHandler: GetClienteHandler,
    private readonly updateClienteHandler: UpdateClienteHandler,
    private readonly removeClienteHandler: RemoveClienteHandler,
    private readonly searchDeletedClientesHandler: SearchDeletedClientesHandler,
    private readonly restoreClienteHandler: RestoreClienteHandler,
    private readonly exportClientesHandler: ExportClientesHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterClienteDto): Promise<void> {
    return this.registerClienteHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<ClientePrimitiveProps>> {
    return this.searchClientesHandler.handle(query)
  }

  // Exports the full filtered cliente set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportClientesQueryDto): Promise<StreamableFile> {
    const rows = await this.exportClientesHandler.handle(query)
    return buildExportFile(rows, CLIENTE_EXPORT_COLUMNS, query.format, 'clientes')
  }

  // La papelera: el mismo search sobre lo soft-borrado. Declarada antes de `:id`.
  @Get('deleted')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  searchDeleted(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<ClientePrimitiveProps>> {
    return this.searchDeletedClientesHandler.handle(query)
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ClientePrimitiveProps> {
    return this.getClienteHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateClienteDto): Promise<void> {
    return this.updateClienteHandler.handle({ id, updates: body as ClienteUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeClienteHandler.handle({ id })
  }

  @Post(':id/restore')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  restore(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.restoreClienteHandler.handle({ id })
  }
}
