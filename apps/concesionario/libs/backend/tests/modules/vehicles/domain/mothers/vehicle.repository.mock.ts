import { Nullable } from '../../../../src/contexts/shared/domain/types'
import { Criteria } from '../../../../src/contexts/shared/domain/query/criteria'
import { Vehicle } from '../../../../src/contexts/dealership/modules/vehicles/domain/vehicle'
import { VehicleRepository } from '../../../../src/contexts/dealership/modules/vehicles/domain/vehicle-repository'
import { Vin } from '../../../../src/contexts/dealership/shared/domain/value-objects/vin.vo'
import { Plate } from '../../../../src/contexts/dealership/shared/domain/value-objects/plate.vo'
import { VehicleId } from '../../../../src/contexts/shared/domain/value-objects/vehicles/vehicle-id.vo'
import { MockRepository } from '../../shared/mocks/mock-repository'

export class VehicleRepositoryMock extends MockRepository<Vehicle> implements VehicleRepository {
  register(vehicle: Vehicle): Promise<void> {
    return this.getMock('register')(vehicle)
  }

  save(vehicle: Vehicle): Promise<void> {
    return this.getMock('save')(vehicle)
  }

  get(vehicleId: VehicleId): Promise<Nullable<Vehicle>> {
    return this.getMock('get')(vehicleId)
  }

  matching(criteria: Criteria): Promise<Vehicle[]> {
    return this.getMock('matching')(criteria)
  }

  findByVin(vin: Vin): Promise<Nullable<Vehicle>> {
    return this.getMock('findByVin')(vin)
  }

  findByPlate(plate: Plate): Promise<Nullable<Vehicle>> {
    return this.getMock('findByPlate')(plate)
  }

  exists(criteria: Criteria): Promise<boolean> {
    return this.getMock('exists')(criteria)
  }

  count(criteria: Criteria): Promise<number> {
    return this.getMock('count')(criteria)
  }

  // helpers
  givenFound(vehicle: Vehicle): void {
    this.setMockResult('get', vehicle)
  }

  givenNotFound(): void {
    this.setMockResult('get', null)
  }

  givenMatching(vehicles: Vehicle[]): void {
    this.setMockResult('matching', vehicles)
  }

  givenMatchingSequence(...results: Vehicle[][]): void {
    const mock = this.getMock('matching')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenByVin(vehicle: Nullable<Vehicle>): void {
    this.setMockResult('findByVin', vehicle)
  }

  givenByPlate(vehicle: Nullable<Vehicle>): void {
    this.setMockResult('findByPlate', vehicle)
  }

  givenAlreadyExists(): void {
    this.setMockResult('exists', true)
  }

  givenDoesNotExist(): void {
    this.setMockResult('exists', false)
  }

  givenExistsSequence(...results: boolean[]): void {
    const mock = this.getMock('exists')
    mock.mockReset()
    results.forEach(result => mock.mockResolvedValueOnce(result))
  }

  givenCount(count: number): void {
    this.setMockResult('count', count)
  }

  whenRegisterSuccess(): void {
    this.setMockResult('register', undefined)
  }

  whenSaveSuccess(): void {
    this.setMockResult('save', undefined)
  }

  whenRegisterFailsOnce(error: Error): void {
    this.getMock('register').mockRejectedValueOnce(error)
  }

  matchingCriteria(): Criteria {
    const calls = this.getMock('matching').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  countCriteria(): Criteria {
    const calls = this.getMock('count').mock.calls
    return calls[calls.length - 1][0] as Criteria
  }

  registeredVehicle(): Vehicle {
    return this.getMock('register').mock.calls[0][0] as Vehicle
  }

  savedVehicle(): Vehicle {
    const calls = this.getMock('save').mock.calls
    return calls[calls.length - 1][0] as Vehicle
  }
}
