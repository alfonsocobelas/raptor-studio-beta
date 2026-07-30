import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { VehicleId } from '../../../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Vehicle } from '../../../domain/vehicle'
import { VehicleRepository } from '../../../domain/vehicle-repository'
import { Vin } from '../../../domain/value-objects/vin.vo'
import { Plate } from '../../../domain/value-objects/plate.vo'
import { VehicleMapper } from './vehicle.mapper'
import { TypeOrmVehicleEntity } from './typeorm-vehicle.entity'

@Injectable()
export class TypeOrmVehicleRepository extends TypeOrmRepository<TypeOrmVehicleEntity> implements VehicleRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmVehicleEntity
  }

  async register(vehicle: Vehicle): Promise<void> {
    await this.repository().save(VehicleMapper.toPersistence(vehicle))
  }

  async save(vehicle: Vehicle): Promise<void> {
    await this.repository().save(VehicleMapper.toPersistence(vehicle))
  }

  async remove(vehicleId: VehicleId): Promise<void> {
    await this.repository().delete({ id: vehicleId.value })
  }

  async get(vehicleId: VehicleId): Promise<Nullable<Vehicle>> {
    const entity = await this.repository().findOneBy({ id: vehicleId.value })
    return entity ? VehicleMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Vehicle[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(VehicleMapper.toDomain)
  }

  async findByVin(vin: Vin): Promise<Nullable<Vehicle>> {
    const entity = await this.repository().findOneBy({ vin: vin.value })
    return entity ? VehicleMapper.toDomain(entity) : null
  }

  async findByPlate(plate: Plate): Promise<Nullable<Vehicle>> {
    const entity = await this.repository().findOneBy({ plate: plate.value })
    return entity ? VehicleMapper.toDomain(entity) : null
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
