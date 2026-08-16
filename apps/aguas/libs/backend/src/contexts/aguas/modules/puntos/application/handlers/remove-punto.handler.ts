import { Injectable } from '@nestjs/common'
import { RemovePuntoInput } from '../dtos/remove-punto-input.dto'
import { RemovePuntoUseCase } from '../use-cases/remove-punto-usecase.service'

@Injectable()
export class RemovePuntoHandler {
  constructor(private readonly useCase: RemovePuntoUseCase) {}

  async handle(input: RemovePuntoInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
