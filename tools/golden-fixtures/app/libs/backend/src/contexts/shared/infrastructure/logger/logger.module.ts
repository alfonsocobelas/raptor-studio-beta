import { Module, Logger, Global } from '@nestjs/common'
import { AppLoggerService } from './app-logger.service'
import { AppLogger } from '../../domain/logger/logger'

@Global()
@Module({
  providers: [
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
