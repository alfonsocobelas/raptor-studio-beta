import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/mongoose/shared-persistence.module'
import { MongooseContractRepository } from '../../src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/mongoose/mongoose-contract.repository'
import { MongooseCustomerRepository } from '../../src/contexts/sap-licensing/modules/customers/infrastructure/persistence/mongoose/mongoose-customer.repository'
import { MongooseLicenseRepository } from '../../src/contexts/sap-licensing/modules/licenses/infrastructure/persistence/mongoose/mongoose-license.repository'

const repositories = [MongooseContractRepository, MongooseCustomerRepository, MongooseLicenseRepository]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
