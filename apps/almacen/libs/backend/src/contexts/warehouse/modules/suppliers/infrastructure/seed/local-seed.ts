import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterSupplierUseCase } from '../../application/use-cases/register-supplier-usecase.service'
import { SuppliersModule } from '../../suppliers.module'
import { SEED_SUPPLIERS } from './local-seed.fixtures'
import { SupplierLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, SuppliersModule]
})
class SupplierSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(SupplierSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerSupplier = context.get(RegisterSupplierUseCase)
    const seeder = new SupplierLocalSeeder(registerSupplier)

    const summary = await seeder.seed(SEED_SUPPLIERS)

    console.log(`[seed] suppliers: +${summary.suppliersCreated} created, ${summary.suppliersSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
