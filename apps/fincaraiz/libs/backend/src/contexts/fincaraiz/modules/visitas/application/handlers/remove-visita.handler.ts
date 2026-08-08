import { Injectable } from '@nestjs/common'
import { RemoveVisitaInput } from '../dtos/remove-visita-input.dto'
import { RemoveVisitaUseCase } from '../use-cases/remove-visita-usecase.service'

@Injectable()
export class RemoveVisitaHandler {
  constructor(private readonly useCase: RemoveVisitaUseCase) {}

  async handle(input: RemoveVisitaInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
