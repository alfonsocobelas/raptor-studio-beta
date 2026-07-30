import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer-usecase.service'
import { CustomersModule } from '../../customers.module'
import { SEED_CUSTOMERS } from './local-seed.fixtures'
import { CustomerLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, CustomersModule]
})
class CustomerSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(CustomerSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerCustomer = context.get(RegisterCustomerUseCase)
    const seeder = new CustomerLocalSeeder(registerCustomer)

    const summary = await seeder.seed(SEED_CUSTOMERS)

    console.log(`[seed] customers: +${summary.customersCreated} created, ${summary.customersSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
