import { Module } from '@nestjs/common'
import { RegisterSupplierHandler } from './application/handlers/register-supplier.handler'
import { SearchSuppliersHandler } from './application/handlers/search-suppliers.handler'
import { GetSupplierHandler } from './application/handlers/get-supplier.handler'
import { UpdateSupplierHandler } from './application/handlers/update-supplier.handler'
import { RemoveSupplierHandler } from './application/handlers/remove-supplier.handler'
import { ExportSuppliersHandler } from './application/handlers/export-suppliers.handler'
import { RegisterSupplierUseCase } from './application/use-cases/register-supplier-usecase.service'
import { SearchSuppliersUseCase } from './application/use-cases/search-suppliers-usecase.service'
import { GetSupplierUseCase } from './application/use-cases/get-supplier-usecase.service'
import { UpdateSupplierUseCase } from './application/use-cases/update-supplier-usecase.service'
import { RemoveSupplierUseCase } from './application/use-cases/remove-supplier-usecase.service'
import { ExportSuppliersUseCase } from './application/use-cases/export-suppliers-usecase.service'
import { SupplierRepository } from './domain/supplier-repository'
import { SuppliersController } from './infrastructure/entrypoints/suppliers.controller'
import { TypeOrmSupplierRepository } from './infrastructure/persistence/typeorm/typeorm-supplier.repository'

@Module({
  controllers: [SuppliersController],
  providers: [
    RegisterSupplierHandler,
    SearchSuppliersHandler,
    GetSupplierHandler,
    UpdateSupplierHandler,
    RemoveSupplierHandler,
    ExportSuppliersHandler,
    RegisterSupplierUseCase,
    SearchSuppliersUseCase,
    GetSupplierUseCase,
    UpdateSupplierUseCase,
    RemoveSupplierUseCase,
    ExportSuppliersUseCase,
    { provide: SupplierRepository, useClass: TypeOrmSupplierRepository }
  ],
  exports: [SupplierRepository]
})
export class SuppliersModule {}
