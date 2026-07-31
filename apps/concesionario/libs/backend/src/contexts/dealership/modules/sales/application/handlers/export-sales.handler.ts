import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { SalePrimitiveProps } from '../../domain/sale-types'
import { ExportSalesUseCase } from '../use-cases/export-sales-usecase.service'

@Injectable()
export class ExportSalesHandler {
  constructor(private readonly useCase: ExportSalesUseCase) {}

  async handle(input: UnpaginatedInput): Promise<SalePrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
