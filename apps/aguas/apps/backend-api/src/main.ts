import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { RootModule } from '@app/backend/root.module'
import { setupApp } from '@app/backend/contexts/shared/infrastructure/http/setup-app'

async function bootstrap(): Promise<void> {
  // bufferLogs retiene los logs del arranque hasta que setupApp cablea useLogger.
  const app = await NestFactory.create(RootModule, { bufferLogs: true })
  setupApp(app)
  // Al recibir SIGTERM/SIGINT dispara los hooks de Nest: TypeORM drena el pool.
  app.enableShutdownHooks()
  // El puerto declarado en la config (app.port) manda; PORT= queda como escape.
  // Con el 3000 fijo, la API ignoraba los puertos elegidos en el diseño y pisaba
  // cualquier otro proyecto abierto en el puerto por defecto de Nest.
  await app.listen(process.env['PORT'] ?? app.get(ConfigService).get<number>('app.port') ?? 3000)
}

bootstrap()
