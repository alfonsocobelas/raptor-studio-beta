import { Injectable } from '@nestjs/common'
import { GetLicenseInput } from '../dtos/get-license-input.dto'
import { GetLicenseUseCase, LicenseDetailOutput } from '../use-cases/get-license-usecase.service'

@Injectable()
export class GetLicenseHandler {
  constructor(private readonly useCase: GetLicenseUseCase) {}

  async handle(input: GetLicenseInput): Promise<LicenseDetailOutput> {
    return this.useCase.invoke(input)
  }
}
