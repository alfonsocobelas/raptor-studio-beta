import { Module } from '@nestjs/common'
import { ContractsModule } from '../contracts/contracts.module'
import { CustomersModule } from '../customers/customers.module'
import { ExportLicensesHandler } from './application/handlers/export-licenses.handler'
import { GetLicenseHandler } from './application/handlers/get-license.handler'
import { RegisterConsumptionHandler } from './application/handlers/register-consumption.handler'
import { SearchLicensesHandler } from './application/handlers/search-licenses.handler'
import { Clock } from './application/ports/clock'
import { GetLicenseUseCase } from './application/use-cases/get-license-usecase.service'
import { ExportLicensesUseCase } from './application/use-cases/export-licenses-usecase.service'
import { RegisterConsumptionUseCase } from './application/use-cases/register-consumption-usecase.service'
// RegisterLicenseUseCase is not exposed via HTTP anymore, but the local seed depends on it.
import { RegisterLicenseUseCase } from './application/use-cases/register-license-usecase.service'
import { SearchLicensesUseCase } from './application/use-cases/search-licenses-usecase.service'
import { SyncLicensesService } from './application/services/sync-licenses.service'
import { SyncLicensesFromMaterialsService } from './application/services/sync-licenses-from-materials.service'
import { ArchiveAbsentLicensesService } from './application/services/archive-absent-licenses.service'
import { SystemClock } from './infrastructure/adapters/system-clock'
import { LicenseRepository } from './domain/license-repository'
import { LicensesController } from './infrastructure/entrypoints/licenses.controller'
import { TypeOrmLicenseRepository } from './infrastructure/persistence/typeorm/typeorm-license.repository'

@Module({
  imports: [CustomersModule, ContractsModule],
  controllers: [LicensesController],
  providers: [
    GetLicenseHandler,
    SearchLicensesHandler,
    RegisterConsumptionHandler,
    ExportLicensesHandler,
    GetLicenseUseCase,
    SearchLicensesUseCase,
    ExportLicensesUseCase,
    RegisterConsumptionUseCase,
    RegisterLicenseUseCase,
    SyncLicensesService,
    SyncLicensesFromMaterialsService,
    ArchiveAbsentLicensesService,
    { provide: LicenseRepository, useClass: TypeOrmLicenseRepository },
    { provide: Clock, useClass: SystemClock }
  ],
  // LicenseRepository lo consume el read-side CustomerSummaryModule (counts de la ficha 360).
  exports: [SyncLicensesService, SyncLicensesFromMaterialsService, ArchiveAbsentLicensesService, LicenseRepository]
})
export class LicensesModule {}
