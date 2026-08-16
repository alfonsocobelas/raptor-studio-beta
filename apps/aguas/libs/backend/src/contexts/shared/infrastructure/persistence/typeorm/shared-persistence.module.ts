import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'path'
import { TypeOrmMuestraEntity } from '../../../../aguas/modules/muestras/infrastructure/persistence/typeorm/typeorm-muestra.entity'
import { TypeOrmMuestraAttachmentEntity } from '../../../../aguas/modules/muestras/infrastructure/attachments/muestra-attachment.entity'
import { TypeOrmPuntoEntity } from '../../../../aguas/modules/puntos/infrastructure/persistence/typeorm/typeorm-punto.entity'
import { TypeOrmClienteEntity } from '../../../../aguas/modules/clientes/infrastructure/persistence/typeorm/typeorm-cliente.entity'
import { TypeOrmParametroEntity } from '../../../../aguas/modules/parametros/infrastructure/persistence/typeorm/typeorm-parametro.entity'
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
          TypeOrmMuestraEntity,
          TypeOrmMuestraAttachmentEntity,
          TypeOrmPuntoEntity,
          TypeOrmClienteEntity,
          TypeOrmParametroEntity
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
