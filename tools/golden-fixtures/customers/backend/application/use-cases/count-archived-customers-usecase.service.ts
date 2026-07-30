import { Injectable } from '@nestjs/common'
import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filters } from '../../../../../shared/domain/query/filters'
import { CustomerRepository } from '../../domain/customer-repository'
import { archivedCustomersFilter } from '../../domain/specifications/customer-active-status.filter'

@Injectable()
export class CountArchivedCustomersUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  invoke(): Promise<number> {
    const criteria = new Criteria({ filters: new Filters([archivedCustomersFilter()]) })
    return this.customerRepository.count(criteria)
  }
}
