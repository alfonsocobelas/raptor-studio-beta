import { Module } from '@nestjs/common'
import { RegisterPuntoHandler } from './application/handlers/register-punto.handler'
import { SearchPuntosHandler } from './application/handlers/search-puntos.handler'
import { GetPuntoHandler } from './application/handlers/get-punto.handler'
import { UpdatePuntoHandler } from './application/handlers/update-punto.handler'
import { RemovePuntoHandler } from './application/handlers/remove-punto.handler'
import { SearchDeletedPuntosHandler } from './application/handlers/search-deleted-puntos.handler'
import { RestorePuntoHandler } from './application/handlers/restore-punto.handler'
import { ExportPuntosHandler } from './application/handlers/export-puntos.handler'
import { RegisterPuntoUseCase } from './application/use-cases/register-punto-usecase.service'
import { SearchPuntosUseCase } from './application/use-cases/search-puntos-usecase.service'
import { GetPuntoUseCase } from './application/use-cases/get-punto-usecase.service'
import { UpdatePuntoUseCase } from './application/use-cases/update-punto-usecase.service'
import { RemovePuntoUseCase } from './application/use-cases/remove-punto-usecase.service'
import { SearchDeletedPuntosUseCase } from './application/use-cases/search-deleted-puntos-usecase.service'
import { RestorePuntoUseCase } from './application/use-cases/restore-punto-usecase.service'
import { ExportPuntosUseCase } from './application/use-cases/export-puntos-usecase.service'
import { PuntoRepository } from './domain/punto-repository'
import { PuntosController } from './infrastructure/entrypoints/puntos.controller'
import { TypeOrmPuntoRepository } from './infrastructure/persistence/typeorm/typeorm-punto.repository'
import { MuestrasModule } from '../muestras/muestras.module'

@Module({
  // Los módulos del árbol de arrastre (spec 38): el borrado del padre marca a sus hijos
  // por sus PORTS, así que la DI cruza módulos — cada hijo ya exporta su repositorio.
  imports: [MuestrasModule],
  controllers: [PuntosController],
  providers: [
    RegisterPuntoHandler,
    SearchPuntosHandler,
    GetPuntoHandler,
    UpdatePuntoHandler,
    RemovePuntoHandler,
    SearchDeletedPuntosHandler,
    RestorePuntoHandler,
    ExportPuntosHandler,
    RegisterPuntoUseCase,
    SearchPuntosUseCase,
    GetPuntoUseCase,
    UpdatePuntoUseCase,
    RemovePuntoUseCase,
    SearchDeletedPuntosUseCase,
    RestorePuntoUseCase,
    ExportPuntosUseCase,
    { provide: PuntoRepository, useClass: TypeOrmPuntoRepository }
  ],
  exports: [PuntoRepository]
})
export class PuntosModule {}
