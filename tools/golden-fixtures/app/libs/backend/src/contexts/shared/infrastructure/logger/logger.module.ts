import { Module, Logger, Global } from '@nestjs/common'
import { AppLoggerService } from './app-logger.service'
import { azureLogTransportsProvider } from './azure-log-transports'
import { AppLogger } from '../../domain/logger/logger'

@Global()
@Module({
  providers: [
    azureLogTransportsProvider,
    AppLoggerService,
    {
      provide: AppLogger,
      useExisting: AppLoggerService
    },
    {
      provide: Logger,
      useExisting: AppLoggerService
    }
  ],
  exports: [AppLogger, Logger]
})
export class LoggerModule {}
