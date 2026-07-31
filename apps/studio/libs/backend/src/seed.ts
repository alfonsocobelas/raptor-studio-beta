import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { GarmentsModule } from './contexts/warehouse/modules/garments/garments.module'
import { RegisterGarmentUseCase } from './contexts/warehouse/modules/garments/application/use-cases/register-garment-usecase.service'
import { SEED_GARMENTS } from './contexts/warehouse/modules/garments/infrastructure/seed/local-seed.fixtures'
import { GarmentLocalSeeder } from './contexts/warehouse/modules/garments/infrastructure/seed/local-seeder'
import { SuppliersModule } from './contexts/warehouse/modules/suppliers/suppliers.module'
import { RegisterSupplierUseCase } from './contexts/warehouse/modules/suppliers/application/use-cases/register-supplier-usecase.service'
import { SEED_SUPPLIERS } from './contexts/warehouse/modules/suppliers/infrastructure/seed/local-seed.fixtures'
import { SupplierLocalSeeder } from './contexts/warehouse/modules/suppliers/infrastructure/seed/local-seeder'
import { MovementsModule } from './contexts/warehouse/modules/movements/movements.module'
import { RegisterMovementUseCase } from './contexts/warehouse/modules/movements/application/use-cases/register-movement-usecase.service'
import { SEED_MOVEMENTS } from './contexts/warehouse/modules/movements/infrastructure/seed/local-seed.fixtures'
import { MovementLocalSeeder } from './contexts/warehouse/modules/movements/infrastructure/seed/local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, GarmentsModule, SuppliersModule, MovementsModule]
})
class SeedModule {}

/**
 * Siembra local de todos los recursos de la app. Idempotente: los duplicados se
 * saltan por los checks de unicidad de cada Register use case.
 */
async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(SeedModule, { logger: ['error', 'warn'] })
  try {
    const garmentsSummary = await new GarmentLocalSeeder(context.get(RegisterGarmentUseCase)).seed(SEED_GARMENTS)
    console.log(
      `[seed] garments: +${garmentsSummary.garmentsCreated} created, ${garmentsSummary.garmentsSkipped} skipped`
    )
    const suppliersSummary = await new SupplierLocalSeeder(context.get(RegisterSupplierUseCase)).seed(SEED_SUPPLIERS)
    console.log(
      `[seed] suppliers: +${suppliersSummary.suppliersCreated} created, ${suppliersSummary.suppliersSkipped} skipped`
    )
    const movementsSummary = await new MovementLocalSeeder(context.get(RegisterMovementUseCase)).seed(SEED_MOVEMENTS)
    console.log(
      `[seed] movements: +${movementsSummary.movementsCreated} created, ${movementsSummary.movementsSkipped} skipped`
    )
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
