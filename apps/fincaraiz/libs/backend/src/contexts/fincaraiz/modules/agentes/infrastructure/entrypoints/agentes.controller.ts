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
import { ExportAgentesHandler } from '../../application/handlers/export-agentes.handler'
import { GetAgenteHandler } from '../../application/handlers/get-agente.handler'
import { RegisterAgenteHandler } from '../../application/handlers/register-agente.handler'
import { RemoveAgenteHandler } from '../../application/handlers/remove-agente.handler'
import { SearchAgentesHandler } from '../../application/handlers/search-agentes.handler'
import { UpdateAgenteHandler } from '../../application/handlers/update-agente.handler'
import { AgentePrimitiveProps, AgenteUpdateProps } from '../../domain/agente-types'
import { ExportAgentesQueryDto } from './dtos/export-agentes-query.dto'
import { AGENTE_EXPORT_COLUMNS } from './agentes-export-columns'
import { RegisterAgenteDto } from './dtos/register-agente.dto'
import { UpdateAgenteDto } from './dtos/update-agente.dto'

@Controller('agentes')
export class AgentesController {
  constructor(
    private readonly registerAgenteHandler: RegisterAgenteHandler,
    private readonly searchAgentesHandler: SearchAgentesHandler,
    private readonly getAgenteHandler: GetAgenteHandler,
    private readonly updateAgenteHandler: UpdateAgenteHandler,
    private readonly removeAgenteHandler: RemoveAgenteHandler,
    private readonly exportAgentesHandler: ExportAgentesHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterAgenteDto): Promise<void> {
    return this.registerAgenteHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<AgentePrimitiveProps>> {
    return this.searchAgentesHandler.handle(query)
  }

  // Exports the full filtered agente set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportAgentesQueryDto): Promise<StreamableFile> {
    const rows = await this.exportAgentesHandler.handle(query)
    return buildExportFile(rows, AGENTE_EXPORT_COLUMNS, query.format, 'agentes')
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<AgentePrimitiveProps> {
    return this.getAgenteHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateAgenteDto): Promise<void> {
    return this.updateAgenteHandler.handle({ id, updates: body as AgenteUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeAgenteHandler.handle({ id })
  }
}
