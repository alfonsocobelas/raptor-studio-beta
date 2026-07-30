import { Module } from '@nestjs/common'
import { RegisterSaleHandler } from './application/handlers/register-sale.handler'
import { SearchSalesHandler } from './application/handlers/search-sales.handler'
import { GetSaleHandler } from './application/handlers/get-sale.handler'
import { UpdateSaleHandler } from './application/handlers/update-sale.handler'
import { RemoveSaleHandler } from './application/handlers/remove-sale.handler'
import { ExportSalesHandler } from './application/handlers/export-sales.handler'
import { RegisterSaleUseCase } from './application/use-cases/register-sale-usecase.service'
import { SearchSalesUseCase } from './application/use-cases/search-sales-usecase.service'
import { GetSaleUseCase } from './application/use-cases/get-sale-usecase.service'
import { UpdateSaleUseCase } from './application/use-cases/update-sale-usecase.service'
import { RemoveSaleUseCase } from './application/use-cases/remove-sale-usecase.service'
import { ExportSalesUseCase } from './application/use-cases/export-sales-usecase.service'
import { SaleRepository } from './domain/sale-repository'
import { SalesController } from './infrastructure/entrypoints/sales.controller'
import { TypeOrmSaleRepository } from './infrastructure/persistence/typeorm/typeorm-sale.repository'

@Module({
  controllers: [SalesController],
  providers: [
    RegisterSaleHandler,
    SearchSalesHandler,
    GetSaleHandler,
    UpdateSaleHandler,
    RemoveSaleHandler,
    ExportSalesHandler,
    RegisterSaleUseCase,
    SearchSalesUseCase,
    GetSaleUseCase,
    UpdateSaleUseCase,
    RemoveSaleUseCase,
    ExportSalesUseCase,
    { provide: SaleRepository, useClass: TypeOrmSaleRepository }
  ],
  exports: [SaleRepository]
})
export class SalesModule {}
