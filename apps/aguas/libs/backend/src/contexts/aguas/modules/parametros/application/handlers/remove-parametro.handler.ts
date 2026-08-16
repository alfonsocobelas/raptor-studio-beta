import { Injectable } from '@nestjs/common'
import { RemoveParametroInput } from '../dtos/remove-parametro-input.dto'
import { RemoveParametroUseCase } from '../use-cases/remove-parametro-usecase.service'

@Injectable()
export class RemoveParametroHandler {
  constructor(private readonly useCase: RemoveParametroUseCase) {}

  async handle(input: RemoveParametroInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
