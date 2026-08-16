import { Injectable } from '@nestjs/common'
import { RemoveMuestraInput } from '../dtos/remove-muestra-input.dto'
import { RemoveMuestraUseCase } from '../use-cases/remove-muestra-usecase.service'

@Injectable()
export class RemoveMuestraHandler {
  constructor(private readonly useCase: RemoveMuestraUseCase) {}

  async handle(input: RemoveMuestraInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
