import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { LoggerInterceptor } from './contexts/shared/infrastructure/interceptors/logger.interceptor'
import { GlobalExceptionFilter } from './contexts/shared/infrastructure/filters/global-exception.filter'
import { HealthModule } from './contexts/shared/infrastructure/health/health.module'
import { GarmentsModule } from './contexts/warehouse/modules/garments/garments.module'
import { SuppliersModule } from './contexts/warehouse/modules/suppliers/suppliers.module'
import { MovementsModule } from './contexts/warehouse/modules/movements/movements.module'

@Module({
  imports: [
    CoreConfigModule,
    LoggerModule,
    SharedPersistenceModule,
    HealthModule,
    GarmentsModule,
    SuppliersModule,
    MovementsModule
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
