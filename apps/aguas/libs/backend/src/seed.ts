import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { ClientesModule } from './contexts/aguas/modules/clientes/clientes.module'
import { RegisterClienteUseCase } from './contexts/aguas/modules/clientes/application/use-cases/register-cliente-usecase.service'
import { SEED_CLIENTES } from './contexts/aguas/modules/clientes/infrastructure/seed/local-seed.fixtures'
import { ClienteLocalSeeder } from './contexts/aguas/modules/clientes/infrastructure/seed/local-seeder'
import { PuntosModule } from './contexts/aguas/modules/puntos/puntos.module'
import { RegisterPuntoUseCase } from './contexts/aguas/modules/puntos/application/use-cases/register-punto-usecase.service'
import { SEED_PUNTOS } from './contexts/aguas/modules/puntos/infrastructure/seed/local-seed.fixtures'
import { PuntoLocalSeeder } from './contexts/aguas/modules/puntos/infrastructure/seed/local-seeder'
import { MuestrasModule } from './contexts/aguas/modules/muestras/muestras.module'
import { RegisterMuestraUseCase } from './contexts/aguas/modules/muestras/application/use-cases/register-muestra-usecase.service'
import { SEED_MUESTRAS } from './contexts/aguas/modules/muestras/infrastructure/seed/local-seed.fixtures'
import { MuestraLocalSeeder } from './contexts/aguas/modules/muestras/infrastructure/seed/local-seeder'
import { ParametrosModule } from './contexts/aguas/modules/parametros/parametros.module'
import { RegisterParametroUseCase } from './contexts/aguas/modules/parametros/application/use-cases/register-parametro-usecase.service'
import { SEED_PARAMETROS } from './contexts/aguas/modules/parametros/infrastructure/seed/local-seed.fixtures'
import { ParametroLocalSeeder } from './contexts/aguas/modules/parametros/infrastructure/seed/local-seeder'

@Module({
  imports: [
    CoreConfigModule,
    LoggerModule,
    SharedPersistenceModule,
    ClientesModule,
    PuntosModule,
    MuestrasModule,
    ParametrosModule
  ]
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
    const clientesSummary = await new ClienteLocalSeeder(context.get(RegisterClienteUseCase)).seed(SEED_CLIENTES)
    console.log(
      `[seed] clientes: +${clientesSummary.clientesCreated} created, ${clientesSummary.clientesSkipped} skipped`
    )
    const puntosSummary = await new PuntoLocalSeeder(context.get(RegisterPuntoUseCase)).seed(SEED_PUNTOS)
    console.log(`[seed] puntos: +${puntosSummary.puntosCreated} created, ${puntosSummary.puntosSkipped} skipped`)
    const muestrasSummary = await new MuestraLocalSeeder(context.get(RegisterMuestraUseCase)).seed(SEED_MUESTRAS)
    console.log(
      `[seed] muestras: +${muestrasSummary.muestrasCreated} created, ${muestrasSummary.muestrasSkipped} skipped`
    )
    const parametrosSummary = await new ParametroLocalSeeder(context.get(RegisterParametroUseCase)).seed(
      SEED_PARAMETROS
    )
    console.log(
      `[seed] parametros: +${parametrosSummary.parametrosCreated} created, ${parametrosSummary.parametrosSkipped} skipped`
    )
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
