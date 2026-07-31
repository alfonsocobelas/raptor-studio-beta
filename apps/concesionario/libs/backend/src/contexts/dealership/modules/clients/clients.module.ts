import { Module } from '@nestjs/common'
import { RegisterClientHandler } from './application/handlers/register-client.handler'
import { SearchClientsHandler } from './application/handlers/search-clients.handler'
import { GetClientHandler } from './application/handlers/get-client.handler'
import { UpdateClientHandler } from './application/handlers/update-client.handler'
import { RemoveClientHandler } from './application/handlers/remove-client.handler'
import { ExportClientsHandler } from './application/handlers/export-clients.handler'
import { RegisterClientUseCase } from './application/use-cases/register-client-usecase.service'
import { SearchClientsUseCase } from './application/use-cases/search-clients-usecase.service'
import { GetClientUseCase } from './application/use-cases/get-client-usecase.service'
import { UpdateClientUseCase } from './application/use-cases/update-client-usecase.service'
import { RemoveClientUseCase } from './application/use-cases/remove-client-usecase.service'
import { ExportClientsUseCase } from './application/use-cases/export-clients-usecase.service'
import { ClientRepository } from './domain/client-repository'
import { ClientsController } from './infrastructure/entrypoints/clients.controller'
import { TypeOrmClientRepository } from './infrastructure/persistence/typeorm/typeorm-client.repository'

@Module({
  controllers: [ClientsController],
  providers: [
    RegisterClientHandler,
    SearchClientsHandler,
    GetClientHandler,
    UpdateClientHandler,
    RemoveClientHandler,
    ExportClientsHandler,
    RegisterClientUseCase,
    SearchClientsUseCase,
    GetClientUseCase,
    UpdateClientUseCase,
    RemoveClientUseCase,
    ExportClientsUseCase,
    { provide: ClientRepository, useClass: TypeOrmClientRepository }
  ],
  exports: [ClientRepository]
})
export class ClientsModule {}
