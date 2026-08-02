import { Module, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as path from 'path'
import { loadStudioEnv } from '@app/backend/contexts/studio/shared/load-studio-env'

// Antes de construir los módulos: el adapter de chat se elige leyendo el entorno.
const env = loadStudioEnv(path.resolve(__dirname, '..', '..', '..'))
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
  const source = env.file ? ` (leído de ${env.file})` : ' (sin .env)'
  console.log(`[studio-api] chat en modo ${env.mode}${source}`)
  app.enableShutdownHooks()
  await app.listen(process.env['PORT'] ?? 3000)
  console.log(`[studio-api] chat + generate en :${process.env['PORT'] ?? 3000} (sin base de datos)`)
}

void bootstrap()
