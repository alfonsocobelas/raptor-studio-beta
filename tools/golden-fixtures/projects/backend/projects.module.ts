import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers/customers.module'
import { ExportProjectsHandler } from './application/handlers/export-projects.handler'
import { GetProjectHandler } from './application/handlers/get-project.handler'
import { RegisterProjectHandler } from './application/handlers/register-project.handler'
import { RemoveProjectHandler } from './application/handlers/remove-project.handler'
import { SearchProjectsHandler } from './application/handlers/search-projects.handler'
import { UpdateProjectHandler } from './application/handlers/update-project.handler'
import { ExportProjectsUseCase } from './application/use-cases/export-projects-usecase.service'
import { GetProjectUseCase } from './application/use-cases/get-project-usecase.service'
import { RegisterProjectUseCase } from './application/use-cases/register-project-usecase.service'
import { RemoveProjectUseCase } from './application/use-cases/remove-project-usecase.service'
import { SearchProjectsUseCase } from './application/use-cases/search-projects-usecase.service'
import { UpdateProjectUseCase } from './application/use-cases/update-project-usecase.service'
import { ArchiveAbsentProjectsService } from './application/services/archive-absent-projects.service'
import { SyncProjectsService } from './application/services/sync-projects.service'
import { ProjectRepository } from './domain/project-repository'
import { ProjectsController } from './infrastructure/entrypoints/projects.controller'
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/typeorm-project.repository'

@Module({
  imports: [CustomersModule],
  controllers: [ProjectsController],
  providers: [
    RegisterProjectHandler,
    SearchProjectsHandler,
    GetProjectHandler,
    UpdateProjectHandler,
    RemoveProjectHandler,
    ExportProjectsHandler,
    RegisterProjectUseCase,
    SearchProjectsUseCase,
    GetProjectUseCase,
    UpdateProjectUseCase,
    RemoveProjectUseCase,
    ExportProjectsUseCase,
    SyncProjectsService,
    ArchiveAbsentProjectsService,
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository }
  ],
  // ProjectRepository lo consume el read-side CustomerSummaryModule (counts de la ficha 360);
  // SyncProjectsService/ArchiveAbsentProjectsService los consumen las fases del sap-sync (spec 46).
  exports: [SyncProjectsService, ArchiveAbsentProjectsService, ProjectRepository]
})
export class ProjectsModule {}
