import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/mongoose/shared-persistence.module'
import { MongooseCustomerRepository } from '../../src/contexts/sap-licensing/modules/customers/infrastructure/persistence/mongoose/mongoose-customer.repository'
import { MongooseContractRepository } from '../../src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/mongoose/mongoose-contract.repository'
import { MongooseProjectRepository } from '../../src/contexts/sap-licensing/modules/projects/infrastructure/persistence/mongoose/mongoose-project.repository'

const repositories = [MongooseCustomerRepository, MongooseContractRepository, MongooseProjectRepository]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
