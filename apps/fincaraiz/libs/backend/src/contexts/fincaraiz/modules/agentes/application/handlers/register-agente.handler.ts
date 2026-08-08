import { Injectable } from '@nestjs/common'
import { RegisterAgenteInput } from '../dtos/register-agente-input.dto'
import { RegisterAgenteUseCase } from '../use-cases/register-agente-usecase.service'

@Injectable()
export class RegisterAgenteHandler {
  constructor(private readonly useCase: RegisterAgenteUseCase) {}

  async handle(input: RegisterAgenteInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
