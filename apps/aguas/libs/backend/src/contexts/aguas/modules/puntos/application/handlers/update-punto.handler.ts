import { Injectable } from '@nestjs/common'
import { UpdatePuntoInput } from '../dtos/update-punto-input.dto'
import { UpdatePuntoUseCase } from '../use-cases/update-punto-usecase.service'

@Injectable()
export class UpdatePuntoHandler {
  constructor(private readonly useCase: UpdatePuntoUseCase) {}

  async handle(input: UpdatePuntoInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
