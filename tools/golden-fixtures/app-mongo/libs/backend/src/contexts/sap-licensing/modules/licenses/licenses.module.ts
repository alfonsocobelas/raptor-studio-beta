import { Module } from '@nestjs/common'
import { SearchLicensesHandler } from './application/handlers/search-licenses.handler'
import { GetLicenseHandler } from './application/handlers/get-license.handler'
import { ExportLicensesHandler } from './application/handlers/export-licenses.handler'
import { AggregateLicensesHandler } from './application/handlers/aggregate-licenses.handler'
import { SearchLicensesUseCase } from './application/use-cases/search-licenses-usecase.service'
import { GetLicenseUseCase } from './application/use-cases/get-license-usecase.service'
import { ExportLicensesUseCase } from './application/use-cases/export-licenses-usecase.service'
import { AggregateLicensesUseCase } from './application/use-cases/aggregate-licenses-usecase.service'
import { LicenseRepository } from './domain/license-repository'
import { LicensesController } from './infrastructure/entrypoints/licenses.controller'
import { MongooseLicenseRepository } from './infrastructure/persistence/mongoose/mongoose-license.repository'

@Module({
  controllers: [LicensesController],
  providers: [
    SearchLicensesHandler,
    GetLicenseHandler,
    ExportLicensesHandler,
    AggregateLicensesHandler,
    SearchLicensesUseCase,
    GetLicenseUseCase,
    ExportLicensesUseCase,
    AggregateLicensesUseCase,
    { provide: LicenseRepository, useClass: MongooseLicenseRepository }
  ],
  exports: [LicenseRepository]
})
export class LicensesModule {}
