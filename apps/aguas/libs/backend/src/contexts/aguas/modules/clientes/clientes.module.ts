import { Module } from '@nestjs/common'
import { RegisterClienteHandler } from './application/handlers/register-cliente.handler'
import { SearchClientesHandler } from './application/handlers/search-clientes.handler'
import { GetClienteHandler } from './application/handlers/get-cliente.handler'
import { UpdateClienteHandler } from './application/handlers/update-cliente.handler'
import { RemoveClienteHandler } from './application/handlers/remove-cliente.handler'
import { SearchDeletedClientesHandler } from './application/handlers/search-deleted-clientes.handler'
import { RestoreClienteHandler } from './application/handlers/restore-cliente.handler'
import { ExportClientesHandler } from './application/handlers/export-clientes.handler'
import { RegisterClienteUseCase } from './application/use-cases/register-cliente-usecase.service'
import { SearchClientesUseCase } from './application/use-cases/search-clientes-usecase.service'
import { GetClienteUseCase } from './application/use-cases/get-cliente-usecase.service'
import { UpdateClienteUseCase } from './application/use-cases/update-cliente-usecase.service'
import { RemoveClienteUseCase } from './application/use-cases/remove-cliente-usecase.service'
import { SearchDeletedClientesUseCase } from './application/use-cases/search-deleted-clientes-usecase.service'
import { RestoreClienteUseCase } from './application/use-cases/restore-cliente-usecase.service'
import { ExportClientesUseCase } from './application/use-cases/export-clientes-usecase.service'
import { ClienteRepository } from './domain/cliente-repository'
import { ClientesController } from './infrastructure/entrypoints/clientes.controller'
import { TypeOrmClienteRepository } from './infrastructure/persistence/typeorm/typeorm-cliente.repository'
import { PuntosModule } from '../puntos/puntos.module'
import { MuestrasModule } from '../muestras/muestras.module'

@Module({
  // Los módulos del árbol de arrastre (spec 38): el borrado del padre marca a sus hijos
  // por sus PORTS, así que la DI cruza módulos — cada hijo ya exporta su repositorio.
  imports: [PuntosModule, MuestrasModule],
  controllers: [ClientesController],
  providers: [
    RegisterClienteHandler,
    SearchClientesHandler,
    GetClienteHandler,
    UpdateClienteHandler,
    RemoveClienteHandler,
    SearchDeletedClientesHandler,
    RestoreClienteHandler,
    ExportClientesHandler,
    RegisterClienteUseCase,
    SearchClientesUseCase,
    GetClienteUseCase,
    UpdateClienteUseCase,
    RemoveClienteUseCase,
    SearchDeletedClientesUseCase,
    RestoreClienteUseCase,
    ExportClientesUseCase,
    { provide: ClienteRepository, useClass: TypeOrmClienteRepository }
  ],
  exports: [ClienteRepository]
})
export class ClientesModule {}
