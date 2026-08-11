import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { LoggerInterceptor } from './contexts/shared/infrastructure/interceptors/logger.interceptor'
import { GlobalExceptionFilter } from './contexts/shared/infrastructure/filters/global-exception.filter'
import { HealthModule } from './contexts/shared/infrastructure/health/health.module'
import { AuthModule } from './contexts/iam/modules/auth/auth.module'
import { ProcessesModule } from './contexts/sap-licensing/processes/processes.module'
import { StorageModule } from './contexts/shared/infrastructure/storage/storage.module'
import { ContractsModule } from './contexts/sap-licensing/modules/contracts/contracts.module'
import { ProjectsModule } from './contexts/sap-licensing/modules/projects/projects.module'
import { CustomersModule } from './contexts/sap-licensing/modules/customers/customers.module'

@Module({
  imports: [
    CoreConfigModule,
    LoggerModule,
    SharedPersistenceModule,
    HealthModule,
    AuthModule,
    ProcessesModule,
    StorageModule,
    ContractsModule,
    ProjectsModule,
    CustomersModule
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
