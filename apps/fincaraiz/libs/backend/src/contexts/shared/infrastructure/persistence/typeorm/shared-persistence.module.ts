import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'path'
import { TypeOrmPropiedadEntity } from '../../../../fincaraiz/modules/propiedades/infrastructure/persistence/typeorm/typeorm-propiedad.entity'
import { TypeOrmPropiedadAttachmentEntity } from '../../../../fincaraiz/modules/propiedades/infrastructure/attachments/propiedad-attachment.entity'
import { TypeOrmVisitaEntity } from '../../../../fincaraiz/modules/visitas/infrastructure/persistence/typeorm/typeorm-visita.entity'
import { TypeOrmAgenteEntity } from '../../../../fincaraiz/modules/agentes/infrastructure/persistence/typeorm/typeorm-agente.entity'
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
        entities: [TypeOrmPropiedadEntity, TypeOrmPropiedadAttachmentEntity, TypeOrmVisitaEntity, TypeOrmAgenteEntity],
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
