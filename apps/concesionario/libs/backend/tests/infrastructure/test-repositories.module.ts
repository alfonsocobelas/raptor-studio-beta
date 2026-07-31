import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TypeOrmVehicleRepository } from '../../src/contexts/dealership/modules/vehicles/infrastructure/persistence/typeorm/typeorm-vehicle.repository'
import { TypeOrmClientRepository } from '../../src/contexts/dealership/modules/clients/infrastructure/persistence/typeorm/typeorm-client.repository'
import { TypeOrmSaleRepository } from '../../src/contexts/dealership/modules/sales/infrastructure/persistence/typeorm/typeorm-sale.repository'

const repositories = [TypeOrmVehicleRepository, TypeOrmClientRepository, TypeOrmSaleRepository]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
