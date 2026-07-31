import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterVehicleUseCase } from '../../application/use-cases/register-vehicle-usecase.service'
import { VehiclesModule } from '../../vehicles.module'
import { SEED_VEHICLES } from './local-seed.fixtures'
import { VehicleLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, VehiclesModule]
})
class VehicleSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(VehicleSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerVehicle = context.get(RegisterVehicleUseCase)
    const seeder = new VehicleLocalSeeder(registerVehicle)

    const summary = await seeder.seed(SEED_VEHICLES)

    console.log(`[seed] vehicles: +${summary.vehiclesCreated} created, ${summary.vehiclesSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
