import { forwardRef, Module } from '@nestjs/common'
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
  // Los módulos del árbol de arrastre (spec 38) y de los orígenes de denormalización
  // (spec 60): la DI cruza módulos — cada uno exporta su repositorio. Van con forwardRef
  // porque las dos specs importan en direcciones opuestas y el ciclo de imports ES
  // dejaría la clase undefined al arrancar Nest.
  imports: [forwardRef(() => CustomersModule)],
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
