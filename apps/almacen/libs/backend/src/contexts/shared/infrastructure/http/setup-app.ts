import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common'
import { AzureLoggerService } from '../logger/azure/azure-logger.service'

export function setupApp(app: INestApplication): void {
  // Sin esto, los logs internos de Nest (y cualquier `new Logger`) irían por el
  // logger de consola por defecto, saltándose winston/OTel y el sanitizador.
  app.useLogger(app.get(AzureLoggerService))
  app.use(helmet())
  app.use(compression())
  app.use(cookieParser())
  // No CORS: nginx sirve el SPA y hace reverse-proxy de /api al backend, así que el
  // navegador siempre habla same-origin (prod y dev vía proxy.conf.json). El cron de
  // sap-sync es machine-to-machine (header x-api-key), ajeno a CORS.
  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  // The global exception filter is registered as an APP_FILTER provider in RootModule
  // (it injects AppLogger), so it is not wired here.
}
