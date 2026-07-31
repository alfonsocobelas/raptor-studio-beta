import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { LicensePrimitiveProps } from '../../domain/license-types'
import { ExportLicensesUseCase } from '../use-cases/export-licenses-usecase.service'

@Injectable()
export class ExportLicensesHandler {
  constructor(private readonly useCase: ExportLicensesUseCase) {}

  async handle(input: UnpaginatedInput): Promise<LicensePrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
