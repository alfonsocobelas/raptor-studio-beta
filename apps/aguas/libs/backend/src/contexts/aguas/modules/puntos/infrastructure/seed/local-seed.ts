import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterPuntoUseCase } from '../../application/use-cases/register-punto-usecase.service'
import { PuntosModule } from '../../puntos.module'
import { SEED_PUNTOS } from './local-seed.fixtures'
import { PuntoLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, PuntosModule]
})
class PuntoSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(PuntoSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerPunto = context.get(RegisterPuntoUseCase)
    const seeder = new PuntoLocalSeeder(registerPunto)

    const summary = await seeder.seed(SEED_PUNTOS)

    console.log(`[seed] puntos: +${summary.puntosCreated} created, ${summary.puntosSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
