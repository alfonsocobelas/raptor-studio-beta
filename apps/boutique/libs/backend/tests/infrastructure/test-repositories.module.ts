import { Module } from '@nestjs/common'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TypeOrmGarmentRepository } from '../../src/contexts/warehouse/modules/garments/infrastructure/persistence/typeorm/typeorm-garment.repository'
import { TypeOrmSupplierRepository } from '../../src/contexts/warehouse/modules/suppliers/infrastructure/persistence/typeorm/typeorm-supplier.repository'
import { TypeOrmMovementRepository } from '../../src/contexts/warehouse/modules/movements/infrastructure/persistence/typeorm/typeorm-movement.repository'

const repositories = [TypeOrmGarmentRepository, TypeOrmSupplierRepository, TypeOrmMovementRepository]

@Module({
  imports: [SharedPersistenceModule],
  providers: repositories,
  exports: repositories
})
export class TestRepositoriesModule {}
