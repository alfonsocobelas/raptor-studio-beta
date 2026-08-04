import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport'
import { ConfigService } from '@nestjs/config'
import type { Provider } from '@nestjs/common'
import * as winston from 'winston'
import { EXTRA_LOG_TRANSPORTS } from './app-logger.service'

// Solo los entornos desplegados tienen un LoggerProvider de OpenTelemetry detrás (lo instala
// initTelemetry con Azure Monitor). En local/test el transporte no tendría dónde escribir, así
// que allí no se añade y los logs se quedan en stdout.
const MONITORED_ENVS = ['dev', 'prod']

/**
 * Transporte extra del logger, enchufado en la costura que deja el logger base: con Azure los
 * logs viajan además a Application Insights, sin que `app-logger.service.ts` sepa de Azure.
 */
export const azureLogTransportsProvider: Provider = {
  provide: EXTRA_LOG_TRANSPORTS,
  inject: [ConfigService],
  useFactory: (config: ConfigService): winston.transport[] => {
    const env = config.get<string>('env') ?? 'prod'

    return MONITORED_ENVS.includes(env) ? [new OpenTelemetryTransportV3()] : []
  }
}
