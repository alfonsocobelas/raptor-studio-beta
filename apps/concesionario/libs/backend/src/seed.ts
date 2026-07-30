import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { VehiclesModule } from './contexts/dealership/modules/vehicles/vehicles.module'
import { RegisterVehicleUseCase } from './contexts/dealership/modules/vehicles/application/use-cases/register-vehicle-usecase.service'
import { SEED_VEHICLES } from './contexts/dealership/modules/vehicles/infrastructure/seed/local-seed.fixtures'
import { VehicleLocalSeeder } from './contexts/dealership/modules/vehicles/infrastructure/seed/local-seeder'
import { ClientsModule } from './contexts/dealership/modules/clients/clients.module'
import { RegisterClientUseCase } from './contexts/dealership/modules/clients/application/use-cases/register-client-usecase.service'
import { SEED_CLIENTS } from './contexts/dealership/modules/clients/infrastructure/seed/local-seed.fixtures'
import { ClientLocalSeeder } from './contexts/dealership/modules/clients/infrastructure/seed/local-seeder'
import { SalesModule } from './contexts/dealership/modules/sales/sales.module'
import { RegisterSaleUseCase } from './contexts/dealership/modules/sales/application/use-cases/register-sale-usecase.service'
import { SEED_SALES } from './contexts/dealership/modules/sales/infrastructure/seed/local-seed.fixtures'
import { SaleLocalSeeder } from './contexts/dealership/modules/sales/infrastructure/seed/local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, VehiclesModule, ClientsModule, SalesModule]
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
    const vehiclesSummary = await new VehicleLocalSeeder(context.get(RegisterVehicleUseCase)).seed(SEED_VEHICLES)
    console.log(
      `[seed] vehicles: +${vehiclesSummary.vehiclesCreated} created, ${vehiclesSummary.vehiclesSkipped} skipped`
    )
    const clientsSummary = await new ClientLocalSeeder(context.get(RegisterClientUseCase)).seed(SEED_CLIENTS)
    console.log(`[seed] clients: +${clientsSummary.clientsCreated} created, ${clientsSummary.clientsSkipped} skipped`)
    const salesSummary = await new SaleLocalSeeder(context.get(RegisterSaleUseCase)).seed(SEED_SALES)
    console.log(`[seed] sales: +${salesSummary.salesCreated} created, ${salesSummary.salesSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
