import { Module } from '@nestjs/common'
import { RegisterParametroHandler } from './application/handlers/register-parametro.handler'
import { SearchParametrosHandler } from './application/handlers/search-parametros.handler'
import { GetParametroHandler } from './application/handlers/get-parametro.handler'
import { UpdateParametroHandler } from './application/handlers/update-parametro.handler'
import { RemoveParametroHandler } from './application/handlers/remove-parametro.handler'
import { SearchDeletedParametrosHandler } from './application/handlers/search-deleted-parametros.handler'
import { RestoreParametroHandler } from './application/handlers/restore-parametro.handler'
import { ExportParametrosHandler } from './application/handlers/export-parametros.handler'
import { RegisterParametroUseCase } from './application/use-cases/register-parametro-usecase.service'
import { SearchParametrosUseCase } from './application/use-cases/search-parametros-usecase.service'
import { GetParametroUseCase } from './application/use-cases/get-parametro-usecase.service'
import { UpdateParametroUseCase } from './application/use-cases/update-parametro-usecase.service'
import { RemoveParametroUseCase } from './application/use-cases/remove-parametro-usecase.service'
import { SearchDeletedParametrosUseCase } from './application/use-cases/search-deleted-parametros-usecase.service'
import { RestoreParametroUseCase } from './application/use-cases/restore-parametro-usecase.service'
import { ExportParametrosUseCase } from './application/use-cases/export-parametros-usecase.service'
import { ParametroRepository } from './domain/parametro-repository'
import { ParametrosController } from './infrastructure/entrypoints/parametros.controller'
import { TypeOrmParametroRepository } from './infrastructure/persistence/typeorm/typeorm-parametro.repository'

@Module({
  controllers: [ParametrosController],
  providers: [
    RegisterParametroHandler,
    SearchParametrosHandler,
    GetParametroHandler,
    UpdateParametroHandler,
    RemoveParametroHandler,
    SearchDeletedParametrosHandler,
    RestoreParametroHandler,
    ExportParametrosHandler,
    RegisterParametroUseCase,
    SearchParametrosUseCase,
    GetParametroUseCase,
    UpdateParametroUseCase,
    RemoveParametroUseCase,
    SearchDeletedParametrosUseCase,
    RestoreParametroUseCase,
    ExportParametrosUseCase,
    { provide: ParametroRepository, useClass: TypeOrmParametroRepository }
  ],
  exports: [ParametroRepository]
})
export class ParametrosModule {}
