import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { CustomerPrimitiveProps } from '../../domain/customer-types'
import { ExportCustomersUseCase } from '../use-cases/export-customers-usecase.service'

@Injectable()
export class ExportCustomersHandler {
  constructor(private readonly useCase: ExportCustomersUseCase) {}

  async handle(input: UnpaginatedInput): Promise<CustomerPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
