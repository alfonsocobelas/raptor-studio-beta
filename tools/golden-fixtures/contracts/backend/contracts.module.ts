import { Module } from '@nestjs/common'
import { RegisterContractHandler } from './application/handlers/register-contract.handler'
import { SearchContractsHandler } from './application/handlers/search-contracts.handler'
import { GetContractHandler } from './application/handlers/get-contract.handler'
import { UpdateContractHandler } from './application/handlers/update-contract.handler'
import { ExportContractsHandler } from './application/handlers/export-contracts.handler'
import { TerminateContractHandler } from './application/handlers/terminate-contract.handler'
import { ExpireContractHandler } from './application/handlers/expire-contract.handler'
import { RegisterContractUseCase } from './application/use-cases/register-contract-usecase.service'
import { SearchContractsUseCase } from './application/use-cases/search-contracts-usecase.service'
import { GetContractUseCase } from './application/use-cases/get-contract-usecase.service'
import { UpdateContractUseCase } from './application/use-cases/update-contract-usecase.service'
import { ExportContractsUseCase } from './application/use-cases/export-contracts-usecase.service'
import { TerminateContractUseCase } from './application/use-cases/terminate-contract-usecase.service'
import { ExpireContractUseCase } from './application/use-cases/expire-contract-usecase.service'
import { ContractRepository } from './domain/contract-repository'
import { ContractsController } from './infrastructure/entrypoints/contracts.controller'
import { TypeOrmContractRepository } from './infrastructure/persistence/typeorm/typeorm-contract.repository'
import { CustomersModule } from '../customers/customers.module'

@Module({
  // Los módulos del árbol de arrastre (spec 38): el borrado del padre marca a sus hijos
  // por sus PORTS, así que la DI cruza módulos — cada hijo ya exporta su repositorio.
  imports: [CustomersModule],
  controllers: [ContractsController],
  providers: [
    RegisterContractHandler,
    SearchContractsHandler,
    GetContractHandler,
    UpdateContractHandler,
    ExportContractsHandler,
    TerminateContractHandler,
    ExpireContractHandler,
    RegisterContractUseCase,
    SearchContractsUseCase,
    GetContractUseCase,
    UpdateContractUseCase,
    ExportContractsUseCase,
    TerminateContractUseCase,
    ExpireContractUseCase,
    { provide: ContractRepository, useClass: TypeOrmContractRepository }
  ],
  exports: [ContractRepository]
})
export class ContractsModule {}
