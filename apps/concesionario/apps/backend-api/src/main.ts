import { NestFactory } from '@nestjs/core'
import { RootModule } from '@app/backend/root.module'
import { setupApp } from '@app/backend/contexts/shared/infrastructure/http/setup-app'

async function bootstrap(): Promise<void> {
  // bufferLogs retiene los logs del arranque hasta que setupApp cablea useLogger.
  const app = await NestFactory.create(RootModule, { bufferLogs: true })
  setupApp(app)
  // Al recibir SIGTERM/SIGINT dispara los hooks de Nest: TypeORM drena el pool.
  app.enableShutdownHooks()
  await app.listen(process.env['PORT'] ?? 3000)
}

bootstrap()
