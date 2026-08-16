import { Injectable } from '@nestjs/common'
import { RestoreParametroInput } from '../dtos/restore-parametro-input.dto'
import { RestoreParametroUseCase } from '../use-cases/restore-parametro-usecase.service'

@Injectable()
export class RestoreParametroHandler {
  constructor(private readonly useCase: RestoreParametroUseCase) {}

  async handle(input: RestoreParametroInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
