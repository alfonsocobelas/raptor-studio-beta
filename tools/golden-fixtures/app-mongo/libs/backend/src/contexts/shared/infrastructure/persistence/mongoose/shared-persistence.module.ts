import { Global, Injectable, Module, type OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectConnection, MongooseModule } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { ContractSchema } from '../../../../sap-licensing/modules/contracts/infrastructure/persistence/mongoose/contract.schema'
import { CustomerSchema } from '../../../../sap-licensing/modules/customers/infrastructure/persistence/mongoose/customer.schema'
import { LicenseSchema } from '../../../../sap-licensing/modules/licenses/infrastructure/persistence/mongoose/license.schema'
import { TransactionManager } from '../../../domain/persistence/transaction-manager'
import { MongooseCriteriaConverter } from './mongoose-criteria-converter'
import { MongooseTransactionManager } from './mongoose-transaction-manager'

// forFeature global: los schemas se derivan del registro de modelos (los hijos de
// composición van embebidos en su padre y no se registran como modelo raíz).
const FEATURES = MongooseModule.forFeature([
  { name: 'Contract', schema: ContractSchema },
  { name: 'Customer', schema: CustomerSchema },
  { name: 'License', schema: LicenseSchema }
])

/**
 * Mongo no tiene migraciones: los índices (incluidos los únicos y sus filtros parciales)
 * viven en los schemas y hay que materializarlos. Se hace al arrancar, no en cada consulta:
 * syncIndexes es idempotente y así una app recién desplegada ya tiene sus restricciones.
 */
@Injectable()
export class MongooseIndexSync implements OnApplicationBootstrap {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all(Object.values(this.connection.models).map(model => model.syncIndexes()))
  }
}

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri')
      })
    }),
    FEATURES
  ],
  providers: [
    MongooseIndexSync,
    MongooseCriteriaConverter,
    MongooseTransactionManager,
    { provide: TransactionManager, useExisting: MongooseTransactionManager }
  ],
  exports: [FEATURES, MongooseCriteriaConverter, MongooseTransactionManager, TransactionManager]
})
export class SharedPersistenceModule {}
