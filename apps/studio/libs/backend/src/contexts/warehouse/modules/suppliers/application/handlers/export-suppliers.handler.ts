import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { SupplierPrimitiveProps } from '../../domain/supplier-types'
import { ExportSuppliersUseCase } from '../use-cases/export-suppliers-usecase.service'

@Injectable()
export class ExportSuppliersHandler {
  constructor(private readonly useCase: ExportSuppliersUseCase) {}

  async handle(input: UnpaginatedInput): Promise<SupplierPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
