import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { LicenseWithConsumption } from '../../domain/license-types'
import { SearchLicensesInput } from '../dtos/search-licenses-input.dto'
import { SearchLicensesUseCase } from '../use-cases/search-licenses-usecase.service'

@Injectable()
export class SearchLicensesHandler {
  constructor(private readonly useCase: SearchLicensesUseCase) {}

  async handle(input: SearchLicensesInput): Promise<OffsetPaginatedOutput<LicenseWithConsumption>> {
    return this.useCase.invoke(input)
  }
}
