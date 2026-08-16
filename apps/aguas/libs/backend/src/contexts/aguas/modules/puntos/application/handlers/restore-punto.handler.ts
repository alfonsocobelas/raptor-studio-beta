import { Injectable } from '@nestjs/common'
import { RestorePuntoInput } from '../dtos/restore-punto-input.dto'
import { RestorePuntoUseCase } from '../use-cases/restore-punto-usecase.service'

@Injectable()
export class RestorePuntoHandler {
  constructor(private readonly useCase: RestorePuntoUseCase) {}

  async handle(input: RestorePuntoInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
