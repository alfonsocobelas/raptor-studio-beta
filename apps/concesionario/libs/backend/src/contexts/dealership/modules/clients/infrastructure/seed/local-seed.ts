import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterClientUseCase } from '../../application/use-cases/register-client-usecase.service'
import { ClientsModule } from '../../clients.module'
import { SEED_CLIENTS } from './local-seed.fixtures'
import { ClientLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, ClientsModule]
})
class ClientSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(ClientSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerClient = context.get(RegisterClientUseCase)
    const seeder = new ClientLocalSeeder(registerClient)

    const summary = await seeder.seed(SEED_CLIENTS)

    console.log(`[seed] clients: +${summary.clientsCreated} created, ${summary.clientsSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
