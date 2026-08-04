import { Module } from '@nestjs/common'
import { RegisterContractHandler } from './application/handlers/register-contract.handler'
import { SearchContractsHandler } from './application/handlers/search-contracts.handler'
import { GetContractHandler } from './application/handlers/get-contract.handler'
import { UpdateContractHandler } from './application/handlers/update-contract.handler'
import { ExportContractsHandler } from './application/handlers/export-contracts.handler'
import { RegisterContractUseCase } from './application/use-cases/register-contract-usecase.service'
import { SearchContractsUseCase } from './application/use-cases/search-contracts-usecase.service'
import { GetContractUseCase } from './application/use-cases/get-contract-usecase.service'
import { UpdateContractUseCase } from './application/use-cases/update-contract-usecase.service'
import { ExportContractsUseCase } from './application/use-cases/export-contracts-usecase.service'
import { ContractRepository } from './domain/contract-repository'
import { ContractsController } from './infrastructure/entrypoints/contracts.controller'
import { MongooseContractRepository } from './infrastructure/persistence/mongoose/mongoose-contract.repository'

@Module({
  controllers: [ContractsController],
  providers: [
    RegisterContractHandler,
    SearchContractsHandler,
    GetContractHandler,
    UpdateContractHandler,
    ExportContractsHandler,
    RegisterContractUseCase,
    SearchContractsUseCase,
    GetContractUseCase,
    UpdateContractUseCase,
    ExportContractsUseCase,
    { provide: ContractRepository, useClass: MongooseContractRepository }
  ],
  exports: [ContractRepository]
})
export class ContractsModule {}
