import { Module } from '@nestjs/common'
import { RegisterAgenteHandler } from './application/handlers/register-agente.handler'
import { SearchAgentesHandler } from './application/handlers/search-agentes.handler'
import { GetAgenteHandler } from './application/handlers/get-agente.handler'
import { UpdateAgenteHandler } from './application/handlers/update-agente.handler'
import { RemoveAgenteHandler } from './application/handlers/remove-agente.handler'
import { ExportAgentesHandler } from './application/handlers/export-agentes.handler'
import { RegisterAgenteUseCase } from './application/use-cases/register-agente-usecase.service'
import { SearchAgentesUseCase } from './application/use-cases/search-agentes-usecase.service'
import { GetAgenteUseCase } from './application/use-cases/get-agente-usecase.service'
import { UpdateAgenteUseCase } from './application/use-cases/update-agente-usecase.service'
import { RemoveAgenteUseCase } from './application/use-cases/remove-agente-usecase.service'
import { ExportAgentesUseCase } from './application/use-cases/export-agentes-usecase.service'
import { AgenteRepository } from './domain/agente-repository'
import { AgentesController } from './infrastructure/entrypoints/agentes.controller'
import { TypeOrmAgenteRepository } from './infrastructure/persistence/typeorm/typeorm-agente.repository'

@Module({
  controllers: [AgentesController],
  providers: [
    RegisterAgenteHandler,
    SearchAgentesHandler,
    GetAgenteHandler,
    UpdateAgenteHandler,
    RemoveAgenteHandler,
    ExportAgentesHandler,
    RegisterAgenteUseCase,
    SearchAgentesUseCase,
    GetAgenteUseCase,
    UpdateAgenteUseCase,
    RemoveAgenteUseCase,
    ExportAgentesUseCase,
    { provide: AgenteRepository, useClass: TypeOrmAgenteRepository }
  ],
  exports: [AgenteRepository]
})
export class AgentesModule {}
