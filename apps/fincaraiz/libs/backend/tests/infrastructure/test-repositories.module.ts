import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TypeOrmPropiedadRepository } from '../../src/contexts/fincaraiz/modules/propiedades/infrastructure/persistence/typeorm/typeorm-propiedad.repository'
import { TypeOrmVisitaRepository } from '../../src/contexts/fincaraiz/modules/visitas/infrastructure/persistence/typeorm/typeorm-visita.repository'
import { TypeOrmAgenteRepository } from '../../src/contexts/fincaraiz/modules/agentes/infrastructure/persistence/typeorm/typeorm-agente.repository'

const repositories = [TypeOrmPropiedadRepository, TypeOrmVisitaRepository, TypeOrmAgenteRepository]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
