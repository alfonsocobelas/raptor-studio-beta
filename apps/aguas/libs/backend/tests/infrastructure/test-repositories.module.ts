import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TypeOrmMuestraRepository } from '../../src/contexts/aguas/modules/muestras/infrastructure/persistence/typeorm/typeorm-muestra.repository'
import { TypeOrmPuntoRepository } from '../../src/contexts/aguas/modules/puntos/infrastructure/persistence/typeorm/typeorm-punto.repository'
import { TypeOrmClienteRepository } from '../../src/contexts/aguas/modules/clientes/infrastructure/persistence/typeorm/typeorm-cliente.repository'
import { TypeOrmParametroRepository } from '../../src/contexts/aguas/modules/parametros/infrastructure/persistence/typeorm/typeorm-parametro.repository'

const repositories = [
  TypeOrmMuestraRepository,
  TypeOrmPuntoRepository,
  TypeOrmClienteRepository,
  TypeOrmParametroRepository
]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
