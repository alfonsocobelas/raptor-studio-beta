import { Module, Logger, Global } from '@nestjs/common'
import { AzureLoggerService } from './azure/azure-logger.service'
import { AppLogger } from '../../domain/logger/logger'

@Global()
@Module({
  providers: [
    AzureLoggerService,
    {
      provide: AppLogger,
      useExisting: AzureLoggerService
    },
    {
      provide: Logger,
      useExisting: AzureLoggerService
    }
  ],
  exports: [AppLogger, Logger]
})
export class LoggerModule {}
