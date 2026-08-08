import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from '../../../../../shared/infrastructure/config/config.module'
import { LoggerModule } from '../../../../../shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from '../../../../../shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { RegisterPropiedadUseCase } from '../../application/use-cases/register-propiedad-usecase.service'
import { PropiedadesModule } from '../../propiedades.module'
import { SEED_PROPIEDADES } from './local-seed.fixtures'
import { PropiedadLocalSeeder } from './local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, PropiedadesModule]
})
class PropiedadSeedModule {}

async function bootstrap(): Promise<void> {
  const env = process.env['NODE_ENV']
  if (env !== 'local') {
    throw new Error(`Local seed can only run with NODE_ENV=local (got: ${env ?? 'undefined'})`)
  }

  const context = await NestFactory.createApplicationContext(PropiedadSeedModule, { logger: ['error', 'warn'] })
  try {
    const registerPropiedad = context.get(RegisterPropiedadUseCase)
    const seeder = new PropiedadLocalSeeder(registerPropiedad)

    const summary = await seeder.seed(SEED_PROPIEDADES)

    console.log(`[seed] propiedades: +${summary.propiedadesCreated} created, ${summary.propiedadesSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
