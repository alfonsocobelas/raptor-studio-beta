import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { SharedPersistenceModule } from './contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { AgentesModule } from './contexts/fincaraiz/modules/agentes/agentes.module'
import { RegisterAgenteUseCase } from './contexts/fincaraiz/modules/agentes/application/use-cases/register-agente-usecase.service'
import { SEED_AGENTES } from './contexts/fincaraiz/modules/agentes/infrastructure/seed/local-seed.fixtures'
import { AgenteLocalSeeder } from './contexts/fincaraiz/modules/agentes/infrastructure/seed/local-seeder'
import { PropiedadesModule } from './contexts/fincaraiz/modules/propiedades/propiedades.module'
import { RegisterPropiedadUseCase } from './contexts/fincaraiz/modules/propiedades/application/use-cases/register-propiedad-usecase.service'
import { SEED_PROPIEDADES } from './contexts/fincaraiz/modules/propiedades/infrastructure/seed/local-seed.fixtures'
import { PropiedadLocalSeeder } from './contexts/fincaraiz/modules/propiedades/infrastructure/seed/local-seeder'
import { VisitasModule } from './contexts/fincaraiz/modules/visitas/visitas.module'
import { RegisterVisitaUseCase } from './contexts/fincaraiz/modules/visitas/application/use-cases/register-visita-usecase.service'
import { SEED_VISITAS } from './contexts/fincaraiz/modules/visitas/infrastructure/seed/local-seed.fixtures'
import { VisitaLocalSeeder } from './contexts/fincaraiz/modules/visitas/infrastructure/seed/local-seeder'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, AgentesModule, PropiedadesModule, VisitasModule]
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
    const agentesSummary = await new AgenteLocalSeeder(context.get(RegisterAgenteUseCase)).seed(SEED_AGENTES)
    console.log(`[seed] agentes: +${agentesSummary.agentesCreated} created, ${agentesSummary.agentesSkipped} skipped`)
    const propiedadesSummary = await new PropiedadLocalSeeder(context.get(RegisterPropiedadUseCase)).seed(
      SEED_PROPIEDADES
    )
    console.log(
      `[seed] propiedades: +${propiedadesSummary.propiedadesCreated} created, ${propiedadesSummary.propiedadesSkipped} skipped`
    )
    const visitasSummary = await new VisitaLocalSeeder(context.get(RegisterVisitaUseCase)).seed(SEED_VISITAS)
    console.log(`[seed] visitas: +${visitasSummary.visitasCreated} created, ${visitasSummary.visitasSkipped} skipped`)
  } finally {
    await context.close()
  }
}

bootstrap().catch((error: unknown) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
