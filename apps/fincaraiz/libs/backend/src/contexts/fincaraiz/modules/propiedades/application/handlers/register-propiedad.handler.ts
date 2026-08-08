import { Injectable } from '@nestjs/common'
import { RegisterPropiedadInput } from '../dtos/register-propiedad-input.dto'
import { RegisterPropiedadUseCase } from '../use-cases/register-propiedad-usecase.service'

@Injectable()
export class RegisterPropiedadHandler {
  constructor(private readonly useCase: RegisterPropiedadUseCase) {}

  async handle(input: RegisterPropiedadInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
