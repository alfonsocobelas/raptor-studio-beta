import { Injectable } from '@nestjs/common'
import { LicenseWithConsumption } from '../../domain/license-types'
import { ExportLicensesInput } from '../dtos/export-licenses-input.dto'
import { ExportLicensesUseCase } from '../use-cases/export-licenses-usecase.service'

@Injectable()
export class ExportLicensesHandler {
  constructor(private readonly useCase: ExportLicensesUseCase) {}

  async handle(input: ExportLicensesInput): Promise<LicenseWithConsumption[]> {
    return this.useCase.invoke(input)
  }
}
