import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { SalePrimitiveProps } from '../../domain/sale-types'
import { SearchSalesUseCase } from '../use-cases/search-sales-usecase.service'

@Injectable()
export class SearchSalesHandler {
  constructor(private readonly useCase: SearchSalesUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<SalePrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
