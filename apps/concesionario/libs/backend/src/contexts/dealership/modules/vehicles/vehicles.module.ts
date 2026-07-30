import { Module } from '@nestjs/common'
import { RegisterVehicleHandler } from './application/handlers/register-vehicle.handler'
import { SearchVehiclesHandler } from './application/handlers/search-vehicles.handler'
import { GetVehicleHandler } from './application/handlers/get-vehicle.handler'
import { UpdateVehicleHandler } from './application/handlers/update-vehicle.handler'
import { RemoveVehicleHandler } from './application/handlers/remove-vehicle.handler'
import { ExportVehiclesHandler } from './application/handlers/export-vehicles.handler'
import { RegisterVehicleUseCase } from './application/use-cases/register-vehicle-usecase.service'
import { SearchVehiclesUseCase } from './application/use-cases/search-vehicles-usecase.service'
import { GetVehicleUseCase } from './application/use-cases/get-vehicle-usecase.service'
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle-usecase.service'
import { RemoveVehicleUseCase } from './application/use-cases/remove-vehicle-usecase.service'
import { ExportVehiclesUseCase } from './application/use-cases/export-vehicles-usecase.service'
import { VehicleRepository } from './domain/vehicle-repository'
import { VehiclesController } from './infrastructure/entrypoints/vehicles.controller'
import { TypeOrmVehicleRepository } from './infrastructure/persistence/typeorm/typeorm-vehicle.repository'

@Module({
  controllers: [VehiclesController],
  providers: [
    RegisterVehicleHandler,
    SearchVehiclesHandler,
    GetVehicleHandler,
    UpdateVehicleHandler,
    RemoveVehicleHandler,
    ExportVehiclesHandler,
    RegisterVehicleUseCase,
    SearchVehiclesUseCase,
    GetVehicleUseCase,
    UpdateVehicleUseCase,
    RemoveVehicleUseCase,
    ExportVehiclesUseCase,
    { provide: VehicleRepository, useClass: TypeOrmVehicleRepository }
  ],
  exports: [VehicleRepository]
})
export class VehiclesModule {}
