import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterLicenseUseCase } from '../../application/use-cases/register-license-usecase.service'
import { LicenseRepository } from '../../domain/license-repository'
import { LicensesModule } from '../../licenses.module'
import { SEED_CONSUMPTION, SEED_LICENSES } from './local-seed.fixtures'
import { LicenseLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, LicensesModule]
})
class LicenseSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(LicenseSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerLicense = context.get(RegisterLicenseUseCase)
    const licenseRepository = context.get(LicenseRepository)
    const seeder = new LicenseLocalSeeder(registerLicense, licenseRepository)

    const summary = await seeder.seed(SEED_LICENSES, SEED_CONSUMPTION)

    console.log(
      `[seed] licenses: +${summary.licensesCreated} created, ${summary.licensesSkipped} skipped | ` +
        `consumption: +${summary.consumptionCreated} created, ${summary.consumptionSkipped} skipped`
    )
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
