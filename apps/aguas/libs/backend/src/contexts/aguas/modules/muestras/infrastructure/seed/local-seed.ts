import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterMuestraUseCase } from '../../application/use-cases/register-muestra-usecase.service'
import { MuestrasModule } from '../../muestras.module'
import { SEED_MUESTRAS } from './local-seed.fixtures'
import { MuestraLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, MuestrasModule]
})
class MuestraSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(MuestraSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerMuestra = context.get(RegisterMuestraUseCase)
    const seeder = new MuestraLocalSeeder(registerMuestra)

    const summary = await seeder.seed(SEED_MUESTRAS)

    console.log(`[seed] muestras: +${summary.muestrasCreated} created, ${summary.muestrasSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
