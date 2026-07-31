import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'path'
import { TypeOrmContractEntity } from '../../../../sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.entity'
import { TypeOrmProjectEntity } from '../../../../sap-licensing/modules/projects/infrastructure/persistence/typeorm/typeorm-project.entity'
import { TransactionManager } from '../../../domain/persistence/transaction-manager'
import { TypeOrmCriteriaConverter } from './typeorm-criteria-converter'
import { TypeOrmTransactionManager } from './typeorm-transaction-manager'
import { TypeOrmUserEntity } from '../../../../iam/modules/auth/infrastructure/persistence/typeorm/typeorm-user.entity'
import { TypeOrmSessionEntity } from '../../../../iam/modules/auth/infrastructure/persistence/typeorm/typeorm-session.entity'
import { TypeOrmAuthTokenEntity } from '../../../../iam/modules/auth/infrastructure/persistence/typeorm/typeorm-auth-token.entity'
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
          TypeOrmUserEntity,
          TypeOrmSessionEntity,
          TypeOrmAuthTokenEntity,
          TypeOrmContractEntity,
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
