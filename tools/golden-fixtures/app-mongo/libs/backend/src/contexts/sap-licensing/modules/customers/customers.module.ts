import { Module } from '@nestjs/common'
import { RegisterCustomerHandler } from './application/handlers/register-customer.handler'
import { SearchCustomersHandler } from './application/handlers/search-customers.handler'
import { GetCustomerHandler } from './application/handlers/get-customer.handler'
import { UpdateCustomerHandler } from './application/handlers/update-customer.handler'
import { ExportCustomersHandler } from './application/handlers/export-customers.handler'
import { AggregateCustomersHandler } from './application/handlers/aggregate-customers.handler'
import { AddContactHandler } from './application/handlers/add-contact.handler'
import { UpdateContactHandler } from './application/handlers/update-contact.handler'
import { RemoveContactHandler } from './application/handlers/remove-contact.handler'
import { RegisterCustomerUseCase } from './application/use-cases/register-customer-usecase.service'
import { SearchCustomersUseCase } from './application/use-cases/search-customers-usecase.service'
import { GetCustomerUseCase } from './application/use-cases/get-customer-usecase.service'
import { UpdateCustomerUseCase } from './application/use-cases/update-customer-usecase.service'
import { ExportCustomersUseCase } from './application/use-cases/export-customers-usecase.service'
import { AggregateCustomersUseCase } from './application/use-cases/aggregate-customers-usecase.service'
import { AddContactUseCase } from './application/use-cases/add-contact-usecase.service'
import { UpdateContactUseCase } from './application/use-cases/update-contact-usecase.service'
import { RemoveContactUseCase } from './application/use-cases/remove-contact-usecase.service'
import { CustomerRepository } from './domain/customer-repository'
import { CustomersController } from './infrastructure/entrypoints/customers.controller'
import { CustomerContactsController } from './infrastructure/entrypoints/customer-contacts.controller'
import { MongooseCustomerRepository } from './infrastructure/persistence/mongoose/mongoose-customer.repository'

@Module({
  controllers: [CustomersController, CustomerContactsController],
  providers: [
    RegisterCustomerHandler,
    SearchCustomersHandler,
    GetCustomerHandler,
    UpdateCustomerHandler,
    ExportCustomersHandler,
    AggregateCustomersHandler,
    AddContactHandler,
    UpdateContactHandler,
    RemoveContactHandler,
    RegisterCustomerUseCase,
    SearchCustomersUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    ExportCustomersUseCase,
    AggregateCustomersUseCase,
    AddContactUseCase,
    UpdateContactUseCase,
    RemoveContactUseCase,
    { provide: CustomerRepository, useClass: MongooseCustomerRepository }
  ],
  exports: [CustomerRepository]
})
export class CustomersModule {}
