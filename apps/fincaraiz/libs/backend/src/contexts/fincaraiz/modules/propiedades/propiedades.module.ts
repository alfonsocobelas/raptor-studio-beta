import { Module } from '@nestjs/common'
import { RegisterPropiedadHandler } from './application/handlers/register-propiedad.handler'
import { SearchPropiedadesHandler } from './application/handlers/search-propiedades.handler'
import { GetPropiedadHandler } from './application/handlers/get-propiedad.handler'
import { UpdatePropiedadHandler } from './application/handlers/update-propiedad.handler'
import { RemovePropiedadHandler } from './application/handlers/remove-propiedad.handler'
import { ExportPropiedadesHandler } from './application/handlers/export-propiedades.handler'
import { RegisterPropiedadUseCase } from './application/use-cases/register-propiedad-usecase.service'
import { SearchPropiedadesUseCase } from './application/use-cases/search-propiedades-usecase.service'
import { GetPropiedadUseCase } from './application/use-cases/get-propiedad-usecase.service'
import { UpdatePropiedadUseCase } from './application/use-cases/update-propiedad-usecase.service'
import { RemovePropiedadUseCase } from './application/use-cases/remove-propiedad-usecase.service'
import { ExportPropiedadesUseCase } from './application/use-cases/export-propiedades-usecase.service'
import { PropiedadRepository } from './domain/propiedad-repository'
import { PropiedadesController } from './infrastructure/entrypoints/propiedades.controller'
import { TypeOrmPropiedadRepository } from './infrastructure/persistence/typeorm/typeorm-propiedad.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StorageModule } from '../../../shared/infrastructure/storage/storage.module'
import { TypeOrmPropiedadAttachmentEntity } from './infrastructure/attachments/propiedad-attachment.entity'
import { PropiedadAttachmentsController } from './infrastructure/attachments/propiedad-attachments.controller'
import { PropiedadAttachmentsService } from './infrastructure/attachments/propiedad-attachments.service'

@Module({
  // StorageModule explícito (no se confía en @Global): así el módulo funciona en
  // cualquier contexto Nest — API, seed o tests — sin depender del root.
  imports: [TypeOrmModule.forFeature([TypeOrmPropiedadAttachmentEntity]), StorageModule],
  // el controller de adjuntos va PRIMERO: Nest resuelve rutas por orden de registro
  // y 'propiedades/attachments' colisionaría con 'propiedades/:id' del recurso
  controllers: [PropiedadAttachmentsController, PropiedadesController],
  providers: [
    PropiedadAttachmentsService,
    RegisterPropiedadHandler,
    SearchPropiedadesHandler,
    GetPropiedadHandler,
    UpdatePropiedadHandler,
    RemovePropiedadHandler,
    ExportPropiedadesHandler,
    RegisterPropiedadUseCase,
    SearchPropiedadesUseCase,
    GetPropiedadUseCase,
    UpdatePropiedadUseCase,
    RemovePropiedadUseCase,
    ExportPropiedadesUseCase,
    { provide: PropiedadRepository, useClass: TypeOrmPropiedadRepository }
  ],
  exports: [PropiedadRepository]
})
export class PropiedadesModule {}
