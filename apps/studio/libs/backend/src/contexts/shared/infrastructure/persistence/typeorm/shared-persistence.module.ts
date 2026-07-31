import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'path'
import { TypeOrmGarmentEntity } from '../../../../warehouse/modules/garments/infrastructure/persistence/typeorm/typeorm-garment.entity'
import { TypeOrmSupplierEntity } from '../../../../warehouse/modules/suppliers/infrastructure/persistence/typeorm/typeorm-supplier.entity'
import { TypeOrmMovementEntity } from '../../../../warehouse/modules/movements/infrastructure/persistence/typeorm/typeorm-movement.entity'
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
        entities: [TypeOrmGarmentEntity, TypeOrmSupplierEntity, TypeOrmMovementEntity],
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
