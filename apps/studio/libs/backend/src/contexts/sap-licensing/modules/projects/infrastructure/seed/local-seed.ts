import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterProjectUseCase } from '../../application/use-cases/register-project-usecase.service'
import { ProjectsModule } from '../../projects.module'
import { SEED_PROJECTS } from './local-seed.fixtures'
import { ProjectLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, ProjectsModule]
})
class ProjectSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(ProjectSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerProject = context.get(RegisterProjectUseCase)
    const seeder = new ProjectLocalSeeder(registerProject)

    const summary = await seeder.seed(SEED_PROJECTS)

    console.log(`[seed] projects: +${summary.projectsCreated} created, ${summary.projectsSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
