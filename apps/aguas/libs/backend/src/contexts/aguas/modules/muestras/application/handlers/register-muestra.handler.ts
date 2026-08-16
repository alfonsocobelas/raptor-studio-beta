import { Injectable } from '@nestjs/common'
import { RegisterMuestraInput } from '../dtos/register-muestra-input.dto'
import { RegisterMuestraUseCase } from '../use-cases/register-muestra-usecase.service'

@Injectable()
export class RegisterMuestraHandler {
  constructor(private readonly useCase: RegisterMuestraUseCase) {}

  async handle(input: RegisterMuestraInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
