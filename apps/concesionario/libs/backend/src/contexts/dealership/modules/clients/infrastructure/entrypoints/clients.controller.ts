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
import { ExportClientsHandler } from '../../application/handlers/export-clients.handler'
import { GetClientHandler } from '../../application/handlers/get-client.handler'
import { RegisterClientHandler } from '../../application/handlers/register-client.handler'
import { RemoveClientHandler } from '../../application/handlers/remove-client.handler'
import { SearchClientsHandler } from '../../application/handlers/search-clients.handler'
import { UpdateClientHandler } from '../../application/handlers/update-client.handler'
import { ClientPrimitiveProps, ClientUpdateProps } from '../../domain/client-types'
import { ExportClientsQueryDto } from './dtos/export-clients-query.dto'
import { CLIENT_EXPORT_COLUMNS } from './clients-export-columns'
import { RegisterClientDto } from './dtos/register-client.dto'
import { UpdateClientDto } from './dtos/update-client.dto'

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly registerClientHandler: RegisterClientHandler,
    private readonly searchClientsHandler: SearchClientsHandler,
    private readonly getClientHandler: GetClientHandler,
    private readonly updateClientHandler: UpdateClientHandler,
    private readonly removeClientHandler: RemoveClientHandler,
    private readonly exportClientsHandler: ExportClientsHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterClientDto): Promise<void> {
    return this.registerClientHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<ClientPrimitiveProps>> {
    return this.searchClientsHandler.handle(query)
  }

  // Exports the full filtered client set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportClientsQueryDto): Promise<StreamableFile> {
    const rows = await this.exportClientsHandler.handle(query)
    return buildExportFile(rows, CLIENT_EXPORT_COLUMNS, query.format, 'clientes')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ClientPrimitiveProps> {
    return this.getClientHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateClientDto): Promise<void> {
    return this.updateClientHandler.handle({ id, updates: body as ClientUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeClientHandler.handle({ id })
  }
}
