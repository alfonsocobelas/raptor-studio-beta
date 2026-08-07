import { Module } from '@nestjs/common'
import { RegisterProjectHandler } from './application/handlers/register-project.handler'
import { SearchProjectsHandler } from './application/handlers/search-projects.handler'
import { GetProjectHandler } from './application/handlers/get-project.handler'
import { UpdateProjectHandler } from './application/handlers/update-project.handler'
import { RemoveProjectHandler } from './application/handlers/remove-project.handler'
import { SearchDeletedProjectsHandler } from './application/handlers/search-deleted-projects.handler'
import { RestoreProjectHandler } from './application/handlers/restore-project.handler'
import { ExportProjectsHandler } from './application/handlers/export-projects.handler'
import { RegisterProjectUseCase } from './application/use-cases/register-project-usecase.service'
import { SearchProjectsUseCase } from './application/use-cases/search-projects-usecase.service'
import { GetProjectUseCase } from './application/use-cases/get-project-usecase.service'
import { UpdateProjectUseCase } from './application/use-cases/update-project-usecase.service'
import { RemoveProjectUseCase } from './application/use-cases/remove-project-usecase.service'
import { SearchDeletedProjectsUseCase } from './application/use-cases/search-deleted-projects-usecase.service'
import { RestoreProjectUseCase } from './application/use-cases/restore-project-usecase.service'
import { ExportProjectsUseCase } from './application/use-cases/export-projects-usecase.service'
import { ProjectRepository } from './domain/project-repository'
import { ProjectsController } from './infrastructure/entrypoints/projects.controller'
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/typeorm-project.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StorageModule } from '../../../shared/infrastructure/storage/storage.module'
import { TypeOrmProjectAttachmentEntity } from './infrastructure/attachments/project-attachment.entity'
import { ProjectAttachmentsController } from './infrastructure/attachments/project-attachments.controller'
import { ProjectAttachmentsService } from './infrastructure/attachments/project-attachments.service'

@Module({
  // StorageModule explícito (no se confía en @Global): así el módulo funciona en
  // cualquier contexto Nest — API, seed o tests — sin depender del root.
  imports: [TypeOrmModule.forFeature([TypeOrmProjectAttachmentEntity]), StorageModule],
  // el controller de adjuntos va PRIMERO: Nest resuelve rutas por orden de registro
  // y 'projects/attachments' colisionaría con 'projects/:id' del recurso
  controllers: [ProjectAttachmentsController, ProjectsController],
  providers: [
    ProjectAttachmentsService,
    RegisterProjectHandler,
    SearchProjectsHandler,
    GetProjectHandler,
    UpdateProjectHandler,
    RemoveProjectHandler,
    SearchDeletedProjectsHandler,
    RestoreProjectHandler,
    ExportProjectsHandler,
    RegisterProjectUseCase,
    SearchProjectsUseCase,
    GetProjectUseCase,
    UpdateProjectUseCase,
    RemoveProjectUseCase,
    SearchDeletedProjectsUseCase,
    RestoreProjectUseCase,
    ExportProjectsUseCase,
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository }
  ],
  exports: [ProjectRepository]
})
export class ProjectsModule {}
