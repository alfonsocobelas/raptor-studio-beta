import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { LoggerInterceptor } from './contexts/shared/infrastructure/interceptors/logger.interceptor'
import { GlobalExceptionFilter } from './contexts/shared/infrastructure/filters/global-exception.filter'
import { HealthModule } from './contexts/shared/infrastructure/health/health.module'
import { ProcessesModule } from './contexts/aguas/processes/processes.module'
import { StorageModule } from './contexts/shared/infrastructure/storage/storage.module'
import { MuestrasModule } from './contexts/aguas/modules/muestras/muestras.module'
import { PuntosModule } from './contexts/aguas/modules/puntos/puntos.module'
import { ClientesModule } from './contexts/aguas/modules/clientes/clientes.module'
import { ParametrosModule } from './contexts/aguas/modules/parametros/parametros.module'

@Module({
  imports: [
    CoreConfigModule,
    LoggerModule,
    SharedPersistenceModule,
    HealthModule,
    ProcessesModule,
    StorageModule,
    MuestrasModule,
    PuntosModule,
    ClientesModule,
    ParametrosModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor
    }
  ]
})
export class RootModule {}
