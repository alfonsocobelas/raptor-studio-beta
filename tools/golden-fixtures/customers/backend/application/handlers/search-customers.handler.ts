import { Injectable } from '@nestjs/common'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { CustomerPrimitiveProps } from '../../domain/customer-types'
import { SearchCustomersOptions } from '../dtos/search-customers-input.dto'
import { SearchCustomersUseCase } from '../use-cases/search-customers-usecase.service'

@Injectable()
export class SearchCustomersHandler {
  constructor(private readonly useCase: SearchCustomersUseCase) {}

  async handle(
    input: OffsetInput,
    options: SearchCustomersOptions = {}
  ): Promise<OffsetPaginatedOutput<CustomerPrimitiveProps>> {
    return this.useCase.invoke(input, options)
  }
}
