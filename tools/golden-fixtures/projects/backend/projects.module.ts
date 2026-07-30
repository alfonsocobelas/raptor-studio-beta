import { Module } from '@nestjs/common'
import { RegisterProjectHandler } from './application/handlers/register-project.handler'
import { SearchProjectsHandler } from './application/handlers/search-projects.handler'
import { GetProjectHandler } from './application/handlers/get-project.handler'
import { UpdateProjectHandler } from './application/handlers/update-project.handler'
import { RemoveProjectHandler } from './application/handlers/remove-project.handler'
import { ExportProjectsHandler } from './application/handlers/export-projects.handler'
import { RegisterProjectUseCase } from './application/use-cases/register-project-usecase.service'
import { SearchProjectsUseCase } from './application/use-cases/search-projects-usecase.service'
import { GetProjectUseCase } from './application/use-cases/get-project-usecase.service'
import { UpdateProjectUseCase } from './application/use-cases/update-project-usecase.service'
import { RemoveProjectUseCase } from './application/use-cases/remove-project-usecase.service'
import { ExportProjectsUseCase } from './application/use-cases/export-projects-usecase.service'
import { ProjectRepository } from './domain/project-repository'
import { ProjectsController } from './infrastructure/entrypoints/projects.controller'
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/typeorm-project.repository'

@Module({
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
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository }
  ],
  exports: [ProjectRepository]
})
export class ProjectsModule {}
