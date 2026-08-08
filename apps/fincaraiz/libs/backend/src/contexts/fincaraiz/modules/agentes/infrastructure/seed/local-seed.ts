import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterAgenteUseCase } from '../../application/use-cases/register-agente-usecase.service'
import { AgentesModule } from '../../agentes.module'
import { SEED_AGENTES } from './local-seed.fixtures'
import { AgenteLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, AgentesModule]
})
class AgenteSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(AgenteSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerAgente = context.get(RegisterAgenteUseCase)
    const seeder = new AgenteLocalSeeder(registerAgente)

    const summary = await seeder.seed(SEED_AGENTES)

    console.log(`[seed] agentes: +${summary.agentesCreated} created, ${summary.agentesSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
