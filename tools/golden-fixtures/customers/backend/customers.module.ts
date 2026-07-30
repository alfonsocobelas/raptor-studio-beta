import { Module } from '@nestjs/common'
import { CountArchivedCustomersHandler } from './application/handlers/count-archived-customers.handler'
import { ExportCustomersHandler } from './application/handlers/export-customers.handler'
import { RegisterCustomerHandler } from './application/handlers/register-customer.handler'
import { GetCustomerHandler } from './application/handlers/get-customer.handler'
import { SearchCustomersHandler } from './application/handlers/search-customers.handler'
import { UpdateCustomerHandler } from './application/handlers/update-customer.handler'
import { AddContactHandler } from './application/handlers/add-contact.handler'
import { UpdateContactHandler } from './application/handlers/update-contact.handler'
import { RemoveContactHandler } from './application/handlers/remove-contact.handler'
import { CountArchivedCustomersUseCase } from './application/use-cases/count-archived-customers-usecase.service'
import { ExportCustomersUseCase } from './application/use-cases/export-customers-usecase.service'
import { RegisterCustomerUseCase } from './application/use-cases/register-customer-usecase.service'
import { GetCustomerUseCase } from './application/use-cases/get-customer-usecase.service'
import { SearchCustomersUseCase } from './application/use-cases/search-customers-usecase.service'
import { UpdateCustomerUseCase } from './application/use-cases/update-customer-usecase.service'
import { AddContactUseCase } from './application/use-cases/add-contact-usecase.service'
import { UpdateContactUseCase } from './application/use-cases/update-contact-usecase.service'
import { RemoveContactUseCase } from './application/use-cases/remove-contact-usecase.service'
import { SyncCustomersService } from './application/services/sync-customers.service'
import { ArchiveAbsentCustomersService } from './application/services/archive-absent-customers.service'
import { CustomerRepository } from './domain/customer-repository'
import { CustomersController } from './infrastructure/entrypoints/customers.controller'
import { CustomerContactsController } from './infrastructure/entrypoints/customer-contacts.controller'
import { TypeOrmCustomerRepository } from './infrastructure/persistence/typeorm/typeorm-customer.repository'

@Module({
  controllers: [CustomersController, CustomerContactsController],
  providers: [
    RegisterCustomerHandler,
    GetCustomerHandler,
    SearchCustomersHandler,
    UpdateCustomerHandler,
    AddContactHandler,
    UpdateContactHandler,
    RemoveContactHandler,
    ExportCustomersHandler,
    CountArchivedCustomersHandler,
    RegisterCustomerUseCase,
    GetCustomerUseCase,
    SearchCustomersUseCase,
    UpdateCustomerUseCase,
    AddContactUseCase,
    UpdateContactUseCase,
    RemoveContactUseCase,
    ExportCustomersUseCase,
    CountArchivedCustomersUseCase,
    SyncCustomersService,
    ArchiveAbsentCustomersService,
    { provide: CustomerRepository, useClass: TypeOrmCustomerRepository }
  ],
  exports: [SyncCustomersService, ArchiveAbsentCustomersService, CustomerRepository]
})
export class CustomersModule {}
