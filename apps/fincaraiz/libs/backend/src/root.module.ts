import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { LoggerInterceptor } from './contexts/shared/infrastructure/interceptors/logger.interceptor'
import { GlobalExceptionFilter } from './contexts/shared/infrastructure/filters/global-exception.filter'
import { HealthModule } from './contexts/shared/infrastructure/health/health.module'
import { StorageModule } from './contexts/shared/infrastructure/storage/storage.module'
import { PropiedadesModule } from './contexts/fincaraiz/modules/propiedades/propiedades.module'
import { VisitasModule } from './contexts/fincaraiz/modules/visitas/visitas.module'
import { AgentesModule } from './contexts/fincaraiz/modules/agentes/agentes.module'

@Module({
  imports: [
    CoreConfigModule,
    LoggerModule,
    SharedPersistenceModule,
    HealthModule,
    StorageModule,
    PropiedadesModule,
    VisitasModule,
    AgentesModule
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
