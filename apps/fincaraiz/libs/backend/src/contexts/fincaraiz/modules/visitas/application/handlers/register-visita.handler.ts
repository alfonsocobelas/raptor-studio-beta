import { Injectable } from '@nestjs/common'
import { RegisterVisitaInput } from '../dtos/register-visita-input.dto'
import { RegisterVisitaUseCase } from '../use-cases/register-visita-usecase.service'

@Injectable()
export class RegisterVisitaHandler {
  constructor(private readonly useCase: RegisterVisitaUseCase) {}

  async handle(input: RegisterVisitaInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
