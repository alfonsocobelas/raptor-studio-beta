import { Module } from '@nestjs/common'
import { ContractsModule } from '../contracts/contracts.module'
import { LicensesModule } from '../licenses/licenses.module'
import { ProjectsModule } from '../projects/projects.module'
import { GetCustomerSummaryHandler } from './application/handlers/get-customer-summary.handler'
import { GetCustomerSummaryUseCase } from './application/use-cases/get-customer-summary-usecase.service'
import { CustomerSummaryController } from './infrastructure/entrypoints/customer-summary.controller'
import { CustomersModule } from './customers.module'

// Read-side de la ficha 360 (spec 27). Módulo aparte para no crear ciclos: contracts/licenses ya
// importan CustomersModule por el sync, así que el summary vive encima de los cuatro módulos de
// escritura y las flechas de dependencia apuntan en un solo sentido.
@Module({
  imports: [CustomersModule, ContractsModule, LicensesModule, ProjectsModule],
  controllers: [CustomerSummaryController],
  providers: [GetCustomerSummaryHandler, GetCustomerSummaryUseCase]
})
export class CustomerSummaryModule {}
