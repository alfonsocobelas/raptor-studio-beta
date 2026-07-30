import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'path'
import { TypeOrmVehicleEntity } from '../../../../dealership/modules/vehicles/infrastructure/persistence/typeorm/typeorm-vehicle.entity'
import { TypeOrmClientEntity } from '../../../../dealership/modules/clients/infrastructure/persistence/typeorm/typeorm-client.entity'
import { TypeOrmSaleEntity } from '../../../../dealership/modules/sales/infrastructure/persistence/typeorm/typeorm-sale.entity'
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
        entities: [TypeOrmVehicleEntity, TypeOrmClientEntity, TypeOrmSaleEntity],
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
