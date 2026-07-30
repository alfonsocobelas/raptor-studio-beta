import { Module } from '@nestjs/common'
import { RegisterGarmentHandler } from './application/handlers/register-garment.handler'
import { SearchGarmentsHandler } from './application/handlers/search-garments.handler'
import { GetGarmentHandler } from './application/handlers/get-garment.handler'
import { UpdateGarmentHandler } from './application/handlers/update-garment.handler'
import { RemoveGarmentHandler } from './application/handlers/remove-garment.handler'
import { ExportGarmentsHandler } from './application/handlers/export-garments.handler'
import { RegisterGarmentUseCase } from './application/use-cases/register-garment-usecase.service'
import { SearchGarmentsUseCase } from './application/use-cases/search-garments-usecase.service'
import { GetGarmentUseCase } from './application/use-cases/get-garment-usecase.service'
import { UpdateGarmentUseCase } from './application/use-cases/update-garment-usecase.service'
import { RemoveGarmentUseCase } from './application/use-cases/remove-garment-usecase.service'
import { ExportGarmentsUseCase } from './application/use-cases/export-garments-usecase.service'
import { GarmentRepository } from './domain/garment-repository'
import { GarmentsController } from './infrastructure/entrypoints/garments.controller'
import { TypeOrmGarmentRepository } from './infrastructure/persistence/typeorm/typeorm-garment.repository'

@Module({
  controllers: [GarmentsController],
  providers: [
    RegisterGarmentHandler,
    SearchGarmentsHandler,
    GetGarmentHandler,
    UpdateGarmentHandler,
    RemoveGarmentHandler,
    ExportGarmentsHandler,
    RegisterGarmentUseCase,
    SearchGarmentsUseCase,
    GetGarmentUseCase,
    UpdateGarmentUseCase,
    RemoveGarmentUseCase,
    ExportGarmentsUseCase,
    { provide: GarmentRepository, useClass: TypeOrmGarmentRepository }
  ],
  exports: [GarmentRepository]
})
export class GarmentsModule {}
