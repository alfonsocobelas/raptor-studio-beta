import { Injectable } from '@nestjs/common'
import { RestoreMuestraInput } from '../dtos/restore-muestra-input.dto'
import { RestoreMuestraUseCase } from '../use-cases/restore-muestra-usecase.service'

@Injectable()
export class RestoreMuestraHandler {
  constructor(private readonly useCase: RestoreMuestraUseCase) {}

  async handle(input: RestoreMuestraInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
