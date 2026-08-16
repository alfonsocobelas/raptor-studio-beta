import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterClienteUseCase } from '../../application/use-cases/register-cliente-usecase.service'
import { ClientesModule } from '../../clientes.module'
import { SEED_CLIENTES } from './local-seed.fixtures'
import { ClienteLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, ClientesModule]
})
class ClienteSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(ClienteSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerCliente = context.get(RegisterClienteUseCase)
    const seeder = new ClienteLocalSeeder(registerCliente)

    const summary = await seeder.seed(SEED_CLIENTES)

    console.log(`[seed] clientes: +${summary.clientesCreated} created, ${summary.clientesSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
