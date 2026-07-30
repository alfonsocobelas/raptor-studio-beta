import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { CustomerPrimitiveProps } from '../../domain/customer-types'
import { SearchCustomersUseCase } from '../use-cases/search-customers-usecase.service'

@Injectable()
export class SearchCustomersHandler {
  constructor(private readonly useCase: SearchCustomersUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<CustomerPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
