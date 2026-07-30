import { Injectable } from '@nestjs/common'
import { GetLicenseInput } from '../dtos/get-license-input.dto'
import { GetLicenseUseCase } from '../use-cases/get-license-usecase.service'
import { LicensePrimitiveProps } from '../../domain/license-types'

@Injectable()
export class GetLicenseHandler {
  constructor(private readonly useCase: GetLicenseUseCase) {}

  async handle(input: GetLicenseInput): Promise<LicensePrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
