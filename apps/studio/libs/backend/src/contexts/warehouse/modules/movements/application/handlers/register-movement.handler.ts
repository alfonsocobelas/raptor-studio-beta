import { Injectable } from '@nestjs/common'
import { RegisterMovementInput } from '../dtos/register-movement-input.dto'
import { RegisterMovementUseCase } from '../use-cases/register-movement-usecase.service'

@Injectable()
export class RegisterMovementHandler {
  constructor(private readonly useCase: RegisterMovementUseCase) {}

  async handle(input: RegisterMovementInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
