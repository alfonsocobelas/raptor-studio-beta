import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'path'
import { TypeOrmCustomerEntity } from '../../../../sap-licensing/modules/customers/infrastructure/persistence/typeorm/typeorm-customer.entity'
import { TypeOrmContactEntity } from '../../../../sap-licensing/modules/customers/infrastructure/persistence/typeorm/typeorm-contact.entity'
import { TypeOrmContractEntity } from '../../../../sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.entity'
import { TypeOrmLicenseEntity } from '../../../../sap-licensing/modules/licenses/infrastructure/persistence/typeorm/typeorm-license.entity'
import { TypeOrmProjectEntity } from '../../../../sap-licensing/modules/projects/infrastructure/persistence/typeorm/typeorm-project.entity'
import { TransactionManager } from '../../../domain/persistence/transaction-manager'
import { TypeOrmCriteriaConverter } from './typeorm-criteria-converter'
import { TypeOrmTransactionManager } from './typeorm-transaction-manager'
import { SnakeNamingStrategy } from './snake-naming.strategy'

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...config.get('typeorm'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          TypeOrmCustomerEntity,
          TypeOrmContactEntity,
          TypeOrmContractEntity,
          TypeOrmLicenseEntity,
          TypeOrmProjectEntity
        ],
        migrations: [join(__dirname, './migrations/*.{ts,js}')]
      })
    })
  ],
  providers: [
    TypeOrmCriteriaConverter,
    TypeOrmTransactionManager,
    { provide: TransactionManager, useExisting: TypeOrmTransactionManager }
  ],
  exports: [TypeOrmModule, TypeOrmCriteriaConverter, TypeOrmTransactionManager, TransactionManager]
})
export class SharedPersistenceModule {}
