import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterMovementUseCase } from '../../application/use-cases/register-movement-usecase.service'
import { MovementsModule } from '../../movements.module'
import { SEED_MOVEMENTS } from './local-seed.fixtures'
import { MovementLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, MovementsModule]
})
class MovementSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(MovementSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerMovement = context.get(RegisterMovementUseCase)
    const seeder = new MovementLocalSeeder(registerMovement)

    const summary = await seeder.seed(SEED_MOVEMENTS)

    console.log(`[seed] movements: +${summary.movementsCreated} created, ${summary.movementsSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
