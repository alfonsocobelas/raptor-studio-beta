import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/mongoose/shared-persistence.module'
import { RegisterContractUseCase } from '../../application/use-cases/register-contract-usecase.service'
import { ContractsModule } from '../../contracts.module'
import { SEED_CONTRACTS } from './local-seed.fixtures'
import { ContractLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, ContractsModule]
})
class ContractSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(ContractSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerContract = context.get(RegisterContractUseCase)
    const seeder = new ContractLocalSeeder(registerContract)

    const summary = await seeder.seed(SEED_CONTRACTS)

    console.log(`[seed] contracts: +${summary.contractsCreated} created, ${summary.contractsSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
