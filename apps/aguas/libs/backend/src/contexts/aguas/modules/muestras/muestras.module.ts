import { Module } from '@nestjs/common'
import { RegisterMuestraHandler } from './application/handlers/register-muestra.handler'
import { SearchMuestrasHandler } from './application/handlers/search-muestras.handler'
import { GetMuestraHandler } from './application/handlers/get-muestra.handler'
import { UpdateMuestraHandler } from './application/handlers/update-muestra.handler'
import { RemoveMuestraHandler } from './application/handlers/remove-muestra.handler'
import { SearchDeletedMuestrasHandler } from './application/handlers/search-deleted-muestras.handler'
import { RestoreMuestraHandler } from './application/handlers/restore-muestra.handler'
import { ExportMuestrasHandler } from './application/handlers/export-muestras.handler'
import { RegisterMuestraUseCase } from './application/use-cases/register-muestra-usecase.service'
import { SearchMuestrasUseCase } from './application/use-cases/search-muestras-usecase.service'
import { GetMuestraUseCase } from './application/use-cases/get-muestra-usecase.service'
import { UpdateMuestraUseCase } from './application/use-cases/update-muestra-usecase.service'
import { RemoveMuestraUseCase } from './application/use-cases/remove-muestra-usecase.service'
import { SearchDeletedMuestrasUseCase } from './application/use-cases/search-deleted-muestras-usecase.service'
import { RestoreMuestraUseCase } from './application/use-cases/restore-muestra-usecase.service'
import { ExportMuestrasUseCase } from './application/use-cases/export-muestras-usecase.service'
import { MuestraRepository } from './domain/muestra-repository'
import { MuestrasController } from './infrastructure/entrypoints/muestras.controller'
import { TypeOrmMuestraRepository } from './infrastructure/persistence/typeorm/typeorm-muestra.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StorageModule } from '../../../shared/infrastructure/storage/storage.module'
import { TypeOrmMuestraAttachmentEntity } from './infrastructure/attachments/muestra-attachment.entity'
import { MuestraAttachmentsController } from './infrastructure/attachments/muestra-attachments.controller'
import { MuestraAttachmentsService } from './infrastructure/attachments/muestra-attachments.service'

@Module({
  // StorageModule explícito (no se confía en @Global): así el módulo funciona en
  // cualquier contexto Nest — API, seed o tests — sin depender del root.
  imports: [TypeOrmModule.forFeature([TypeOrmMuestraAttachmentEntity]), StorageModule],
  // el controller de adjuntos va PRIMERO: Nest resuelve rutas por orden de registro
  // y 'muestras/attachments' colisionaría con 'muestras/:id' del recurso
  controllers: [MuestraAttachmentsController, MuestrasController],
  providers: [
    MuestraAttachmentsService,
    RegisterMuestraHandler,
    SearchMuestrasHandler,
    GetMuestraHandler,
    UpdateMuestraHandler,
    RemoveMuestraHandler,
    SearchDeletedMuestrasHandler,
    RestoreMuestraHandler,
    ExportMuestrasHandler,
    RegisterMuestraUseCase,
    SearchMuestrasUseCase,
    GetMuestraUseCase,
    UpdateMuestraUseCase,
    RemoveMuestraUseCase,
    SearchDeletedMuestrasUseCase,
    RestoreMuestraUseCase,
    ExportMuestrasUseCase,
    { provide: MuestraRepository, useClass: TypeOrmMuestraRepository }
  ],
  exports: [MuestraRepository]
})
export class MuestrasModule {}
