import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers/customers.module'
import { ExportContractsHandler } from './application/handlers/export-contracts.handler'
import { GetContractHandler } from './application/handlers/get-contract.handler'
import { RegisterContractHandler } from './application/handlers/register-contract.handler'
import { SearchContractsHandler } from './application/handlers/search-contracts.handler'
import { UpdateContractHandler } from './application/handlers/update-contract.handler'
import { ExportContractsUseCase } from './application/use-cases/export-contracts-usecase.service'
import { GetContractUseCase } from './application/use-cases/get-contract-usecase.service'
import { RegisterContractUseCase } from './application/use-cases/register-contract-usecase.service'
import { SearchContractsUseCase } from './application/use-cases/search-contracts-usecase.service'
import { SyncContractsService } from './application/services/sync-contracts.service'
import { SyncMaintenanceService } from './application/services/sync-maintenance.service'
import { ArchiveAbsentContractsService } from './application/services/archive-absent-contracts.service'
import { UpdateContractUseCase } from './application/use-cases/update-contract-usecase.service'
import { ContractLicenseValueReader } from './domain/contract-license-value-reader'
import { ContractRepository } from './domain/contract-repository'
import { ContractsController } from './infrastructure/entrypoints/contracts.controller'
import { TypeOrmContractLicenseValueReader } from './infrastructure/persistence/typeorm/typeorm-contract-license-value.reader'
import { TypeOrmContractRepository } from './infrastructure/persistence/typeorm/typeorm-contract.repository'

@Module({
  imports: [CustomersModule],
  controllers: [ContractsController],
  providers: [
    RegisterContractHandler,
    GetContractHandler,
    SearchContractsHandler,
    UpdateContractHandler,
    ExportContractsHandler,
    RegisterContractUseCase,
    GetContractUseCase,
    SearchContractsUseCase,
    UpdateContractUseCase,
    ExportContractsUseCase,
    SyncContractsService,
    SyncMaintenanceService,
    ArchiveAbsentContractsService,
    { provide: ContractRepository, useClass: TypeOrmContractRepository },
    { provide: ContractLicenseValueReader, useClass: TypeOrmContractLicenseValueReader }
  ],
  // ContractRepository lo consume el read-side CustomerSummaryModule (counts de la ficha 360).
  exports: [SyncContractsService, SyncMaintenanceService, ArchiveAbsentContractsService, ContractRepository]
})
export class ContractsModule {}
