import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterParametroUseCase } from '../../application/use-cases/register-parametro-usecase.service'
import { ParametrosModule } from '../../parametros.module'
import { SEED_PARAMETROS } from './local-seed.fixtures'
import { ParametroLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, ParametrosModule]
})
class ParametroSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(ParametroSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerParametro = context.get(RegisterParametroUseCase)
    const seeder = new ParametroLocalSeeder(registerParametro)

    const summary = await seeder.seed(SEED_PARAMETROS)

    console.log(`[seed] parametros: +${summary.parametrosCreated} created, ${summary.parametrosSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
