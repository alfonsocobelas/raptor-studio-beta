import { Injectable } from '@nestjs/common'
import { RegisterGarmentInput } from '../dtos/register-garment-input.dto'
import { RegisterGarmentUseCase } from '../use-cases/register-garment-usecase.service'

@Injectable()
export class RegisterGarmentHandler {
  constructor(private readonly useCase: RegisterGarmentUseCase) {}

  async handle(input: RegisterGarmentInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
