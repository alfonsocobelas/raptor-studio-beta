import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterVisitaUseCase } from '../../application/use-cases/register-visita-usecase.service'
import { VisitasModule } from '../../visitas.module'
import { SEED_VISITAS } from './local-seed.fixtures'
import { VisitaLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, VisitasModule]
})
class VisitaSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(VisitaSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerVisita = context.get(RegisterVisitaUseCase)
    const seeder = new VisitaLocalSeeder(registerVisita)

    const summary = await seeder.seed(SEED_VISITAS)

    console.log(`[seed] visitas: +${summary.visitasCreated} created, ${summary.visitasSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
