import { Module, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { StudioChatModule } from '@app/backend/contexts/studio/chat/studio-chat.module'
import { StudioGenerateModule } from '@app/backend/contexts/studio/generate/studio-generate.module'

/**
 * API ligera del estudio: SOLO chat + generación. Sin TypeORM ni Postgres —
 * los CRUD de demo del backend completo no son un requisito del estudio.
 * Arranque: `npm run studio:api` (puerto 3000, mismo proxy que la web).
 */
@Module({
  imports: [StudioChatModule, StudioGenerateModule]
})
class StudioApiModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(StudioApiModule)
  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  app.enableShutdownHooks()
  await app.listen(process.env['PORT'] ?? 3000)
  console.log(`[studio-api] chat + generate en :${process.env['PORT'] ?? 3000} (sin base de datos)`)
}

void bootstrap()
