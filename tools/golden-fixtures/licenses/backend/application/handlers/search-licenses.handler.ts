import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { LicensePrimitiveProps } from '../../domain/license-types'
import { SearchLicensesUseCase } from '../use-cases/search-licenses-usecase.service'

@Injectable()
export class SearchLicensesHandler {
  constructor(private readonly useCase: SearchLicensesUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<LicensePrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
