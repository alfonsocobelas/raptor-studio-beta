import { Module } from '@nestjs/common'
import { RegisterVisitaHandler } from './application/handlers/register-visita.handler'
import { SearchVisitasHandler } from './application/handlers/search-visitas.handler'
import { GetVisitaHandler } from './application/handlers/get-visita.handler'
import { UpdateVisitaHandler } from './application/handlers/update-visita.handler'
import { RemoveVisitaHandler } from './application/handlers/remove-visita.handler'
import { ExportVisitasHandler } from './application/handlers/export-visitas.handler'
import { RegisterVisitaUseCase } from './application/use-cases/register-visita-usecase.service'
import { SearchVisitasUseCase } from './application/use-cases/search-visitas-usecase.service'
import { GetVisitaUseCase } from './application/use-cases/get-visita-usecase.service'
import { UpdateVisitaUseCase } from './application/use-cases/update-visita-usecase.service'
import { RemoveVisitaUseCase } from './application/use-cases/remove-visita-usecase.service'
import { ExportVisitasUseCase } from './application/use-cases/export-visitas-usecase.service'
import { VisitaRepository } from './domain/visita-repository'
import { VisitasController } from './infrastructure/entrypoints/visitas.controller'
import { TypeOrmVisitaRepository } from './infrastructure/persistence/typeorm/typeorm-visita.repository'

@Module({
  controllers: [VisitasController],
  providers: [
    RegisterVisitaHandler,
    SearchVisitasHandler,
    GetVisitaHandler,
    UpdateVisitaHandler,
    RemoveVisitaHandler,
    ExportVisitasHandler,
    RegisterVisitaUseCase,
    SearchVisitasUseCase,
    GetVisitaUseCase,
    UpdateVisitaUseCase,
    RemoveVisitaUseCase,
    ExportVisitasUseCase,
    { provide: VisitaRepository, useClass: TypeOrmVisitaRepository }
  ],
  exports: [VisitaRepository]
})
export class VisitasModule {}
