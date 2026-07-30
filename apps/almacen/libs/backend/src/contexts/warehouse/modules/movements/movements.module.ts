import { Module } from '@nestjs/common'
import { RegisterMovementHandler } from './application/handlers/register-movement.handler'
import { SearchMovementsHandler } from './application/handlers/search-movements.handler'
import { GetMovementHandler } from './application/handlers/get-movement.handler'
import { UpdateMovementHandler } from './application/handlers/update-movement.handler'
import { RemoveMovementHandler } from './application/handlers/remove-movement.handler'
import { ExportMovementsHandler } from './application/handlers/export-movements.handler'
import { RegisterMovementUseCase } from './application/use-cases/register-movement-usecase.service'
import { SearchMovementsUseCase } from './application/use-cases/search-movements-usecase.service'
import { GetMovementUseCase } from './application/use-cases/get-movement-usecase.service'
import { UpdateMovementUseCase } from './application/use-cases/update-movement-usecase.service'
import { RemoveMovementUseCase } from './application/use-cases/remove-movement-usecase.service'
import { ExportMovementsUseCase } from './application/use-cases/export-movements-usecase.service'
import { MovementRepository } from './domain/movement-repository'
import { MovementsController } from './infrastructure/entrypoints/movements.controller'
import { TypeOrmMovementRepository } from './infrastructure/persistence/typeorm/typeorm-movement.repository'

@Module({
  controllers: [MovementsController],
  providers: [
    RegisterMovementHandler,
    SearchMovementsHandler,
    GetMovementHandler,
    UpdateMovementHandler,
    RemoveMovementHandler,
    ExportMovementsHandler,
    RegisterMovementUseCase,
    SearchMovementsUseCase,
    GetMovementUseCase,
    UpdateMovementUseCase,
    RemoveMovementUseCase,
    ExportMovementsUseCase,
    { provide: MovementRepository, useClass: TypeOrmMovementRepository }
  ],
  exports: [MovementRepository]
})
export class MovementsModule {}
