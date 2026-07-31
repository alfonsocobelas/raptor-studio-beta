import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterSaleUseCase } from '../../application/use-cases/register-sale-usecase.service'
import { SalesModule } from '../../sales.module'
import { SEED_SALES } from './local-seed.fixtures'
import { SaleLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, SalesModule]
})
class SaleSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(SaleSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerSale = context.get(RegisterSaleUseCase)
    const seeder = new SaleLocalSeeder(registerSale)

    const summary = await seeder.seed(SEED_SALES)

    console.log(`[seed] sales: +${summary.salesCreated} created, ${summary.salesSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
