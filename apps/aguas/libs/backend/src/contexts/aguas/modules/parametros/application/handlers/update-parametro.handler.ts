import { Injectable } from '@nestjs/common'
import { UpdateParametroInput } from '../dtos/update-parametro-input.dto'
import { UpdateParametroUseCase } from '../use-cases/update-parametro-usecase.service'

@Injectable()
export class UpdateParametroHandler {
  constructor(private readonly useCase: UpdateParametroUseCase) {}

  async handle(input: UpdateParametroInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
