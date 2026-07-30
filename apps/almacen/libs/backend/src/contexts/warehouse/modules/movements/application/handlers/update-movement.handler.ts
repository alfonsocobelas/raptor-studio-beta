import { Injectable } from '@nestjs/common'
import { UpdateMovementInput } from '../dtos/update-movement-input.dto'
import { UpdateMovementUseCase } from '../use-cases/update-movement-usecase.service'

@Injectable()
export class UpdateMovementHandler {
  constructor(private readonly useCase: UpdateMovementUseCase) {}

  async handle(input: UpdateMovementInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
