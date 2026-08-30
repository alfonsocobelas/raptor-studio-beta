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
import { AuditEvent } from '../../../../../shared/domain/audit/audit-event'
import { ExportProjectsHandler } from '../../application/handlers/export-projects.handler'
import { GetProjectHandler } from '../../application/handlers/get-project.handler'
import { GetProjectHistoryHandler } from '../../application/handlers/get-project-history.handler'
import { RegisterProjectHandler } from '../../application/handlers/register-project.handler'
import { RemoveProjectHandler } from '../../application/handlers/remove-project.handler'
import { AggregateProjectsHandler } from '../../application/handlers/aggregate-projects.handler'
import { SearchProjectsHandler } from '../../application/handlers/search-projects.handler'
import { UpdateProjectHandler } from '../../application/handlers/update-project.handler'
import { ProjectPrimitiveProps, ProjectUpdateProps } from '../../domain/project-types'
import { AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateProjectsQueryDto } from './dtos/aggregate-projects-query.dto'
import { ExportProjectsQueryDto } from './dtos/export-projects-query.dto'
import { PROJECT_EXPORT_COLUMNS } from './projects-export-columns'
import { RegisterProjectDto } from './dtos/register-project.dto'
import { UpdateProjectDto } from './dtos/update-project.dto'

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly registerProjectHandler: RegisterProjectHandler,
    private readonly searchProjectsHandler: SearchProjectsHandler,
    private readonly aggregateProjectsHandler: AggregateProjectsHandler,
    private readonly getProjectHandler: GetProjectHandler,
    private readonly getProjectHistoryHandler: GetProjectHistoryHandler,
    private readonly updateProjectHandler: UpdateProjectHandler,
    private readonly removeProjectHandler: RemoveProjectHandler,
    private readonly exportProjectsHandler: ExportProjectsHandler
  ) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  register(@Body() body: RegisterProjectDto): Promise<void> {
    return this.registerProjectHandler.handle(body)
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  search(
    @Query(new ParseCriteriaPipe()) query: PaginateOffsetDto
  ): Promise<OffsetPaginatedOutput<ProjectPrimitiveProps>> {
    return this.searchProjectsHandler.handle(query)
  }

  // Una agregación del conjunto filtrado (spec 71). Declarado antes de `:id`, o 'aggregate' se
  // leería como un uuid. Mismos roles que el listado: agregar es leer, no una capacidad nueva.
  @Get('aggregate')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  aggregate(@Query(new ParseCriteriaPipe()) query: AggregateProjectsQueryDto): Promise<AggregateOutput> {
    return this.aggregateProjectsHandler.handle(query)
  }

  // Exports the full filtered project set (no pagination) as CSV/XLSX. Declared before `:id`.
  @Get('export')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  async export(@Query(new ParseCriteriaPipe()) query: ExportProjectsQueryDto): Promise<StreamableFile> {
    const rows = await this.exportProjectsHandler.handle(query)
    return buildExportFile(rows, PROJECT_EXPORT_COLUMNS, query.format, 'proyectos')
  }

  // La timeline de la ficha (spec 31): los últimos eventos del registro.
  @Get(':id/history')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  history(@Param('id', ParseUUIDv7Pipe) id: string): Promise<AuditEvent[]> {
    return this.getProjectHistoryHandler.handle({ id })
  }

  @Get(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER)
  getById(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ProjectPrimitiveProps> {
    return this.getProjectHandler.handle({ id })
  }

  @Put(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDv7Pipe) id: string, @Body() body: UpdateProjectDto): Promise<void> {
    const { version, ...updates } = body
    return this.updateProjectHandler.handle({ id, version, updates: updates as ProjectUpdateProps })
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.removeProjectHandler.handle({ id })
  }
}
