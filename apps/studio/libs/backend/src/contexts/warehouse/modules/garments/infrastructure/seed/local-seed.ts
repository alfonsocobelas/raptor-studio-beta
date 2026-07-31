import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterGarmentUseCase } from '../../application/use-cases/register-garment-usecase.service'
import { GarmentsModule } from '../../garments.module'
import { SEED_GARMENTS } from './local-seed.fixtures'
import { GarmentLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, GarmentsModule]
})
class GarmentSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(GarmentSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerGarment = context.get(RegisterGarmentUseCase)
    const seeder = new GarmentLocalSeeder(registerGarment)

    const summary = await seeder.seed(SEED_GARMENTS)

    console.log(`[seed] garments: +${summary.garmentsCreated} created, ${summary.garmentsSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
