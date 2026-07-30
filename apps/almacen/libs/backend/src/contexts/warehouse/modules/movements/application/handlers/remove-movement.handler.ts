import { Injectable } from '@nestjs/common'
import { RemoveMovementInput } from '../dtos/remove-movement-input.dto'
import { RemoveMovementUseCase } from '../use-cases/remove-movement-usecase.service'

@Injectable()
export class RemoveMovementHandler {
  constructor(private readonly useCase: RemoveMovementUseCase) {}

  async handle(input: RemoveMovementInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
