import { Injectable } from '@nestjs/common'
import { UpdateVisitaInput } from '../dtos/update-visita-input.dto'
import { UpdateVisitaUseCase } from '../use-cases/update-visita-usecase.service'

@Injectable()
export class UpdateVisitaHandler {
  constructor(private readonly useCase: UpdateVisitaUseCase) {}

  async handle(input: UpdateVisitaInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
