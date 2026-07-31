import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TypeOrmCustomerRepository } from '../../src/contexts/sap-licensing/modules/customers/infrastructure/persistence/typeorm/typeorm-customer.repository'
import { TypeOrmContractRepository } from '../../src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.repository'
import { TypeOrmLicenseRepository } from '../../src/contexts/sap-licensing/modules/licenses/infrastructure/persistence/typeorm/typeorm-license.repository'
import { TypeOrmProjectRepository } from '../../src/contexts/sap-licensing/modules/projects/infrastructure/persistence/typeorm/typeorm-project.repository'

const repositories = [
  TypeOrmCustomerRepository,
  TypeOrmContractRepository,
  TypeOrmLicenseRepository,
  TypeOrmProjectRepository
]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
