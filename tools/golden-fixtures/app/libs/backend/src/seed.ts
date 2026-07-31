import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { ContractsModule } from './contexts/sap-licensing/modules/contracts/contracts.module'
import { RegisterContractUseCase } from './contexts/sap-licensing/modules/contracts/application/use-cases/register-contract-usecase.service'
import { SEED_CONTRACTS } from './contexts/sap-licensing/modules/contracts/infrastructure/seed/local-seed.fixtures'
import { ContractLocalSeeder } from './contexts/sap-licensing/modules/contracts/infrastructure/seed/local-seeder'
import { ProjectsModule } from './contexts/sap-licensing/modules/projects/projects.module'
import { RegisterProjectUseCase } from './contexts/sap-licensing/modules/projects/application/use-cases/register-project-usecase.service'
import { SEED_PROJECTS } from './contexts/sap-licensing/modules/projects/infrastructure/seed/local-seed.fixtures'
import { ProjectLocalSeeder } from './contexts/sap-licensing/modules/projects/infrastructure/seed/local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, ContractsModule, ProjectsModule]
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
    const contractsSummary = await new ContractLocalSeeder(context.get(RegisterContractUseCase)).seed(SEED_CONTRACTS)
    console.log(
      `[seed] contracts: +${contractsSummary.contractsCreated} created, ${contractsSummary.contractsSkipped} skipped`
    )
    const projectsSummary = await new ProjectLocalSeeder(context.get(RegisterProjectUseCase)).seed(SEED_PROJECTS)
    console.log(
      `[seed] projects: +${projectsSummary.projectsCreated} created, ${projectsSummary.projectsSkipped} skipped`
    )
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
