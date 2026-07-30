import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { CustomersModule } from '../../customers.module'
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer-usecase.service'
import { LocalSeeder } from './local-seeder'
import { SEED_CONTACTS, SEED_CUSTOMERS } from './local-seed.fixtures'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, CustomersModule]
})
class SeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(SeedModule, { logger: ['error', 'warn'] })
  try {
    const registerCustomer = context.get(RegisterCustomerUseCase)
    const dataSource = context.get(DataSource)
    const seeder = new LocalSeeder(registerCustomer, dataSource)

    const summary = await seeder.seed(SEED_CUSTOMERS, SEED_CONTACTS)

    console.log(
      `[seed] customers: +${summary.customersCreated} created, ${summary.customersSkipped} skipped | ` +
        `contacts: +${summary.contactsCreated} created, ${summary.contactsSkipped} skipped`
    )
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
