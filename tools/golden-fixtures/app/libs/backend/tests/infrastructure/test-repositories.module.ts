import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TypeOrmContractRepository } from '../../src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.repository'
import { TypeOrmProjectRepository } from '../../src/contexts/sap-licensing/modules/projects/infrastructure/persistence/typeorm/typeorm-project.repository'
import { TypeOrmUserRepository } from '../../src/contexts/iam/modules/auth/infrastructure/persistence/typeorm/typeorm-user.repository'

const repositories = [TypeOrmContractRepository, TypeOrmProjectRepository, TypeOrmUserRepository]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
