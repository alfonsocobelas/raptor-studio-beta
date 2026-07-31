import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { SupplierPrimitiveProps } from '../../domain/supplier-types'
import { SearchSuppliersUseCase } from '../use-cases/search-suppliers-usecase.service'

@Injectable()
export class SearchSuppliersHandler {
  constructor(private readonly useCase: SearchSuppliersUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<SupplierPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
