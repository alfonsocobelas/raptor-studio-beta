import { Injectable } from '@nestjs/common'
import { GetMovementInput } from '../dtos/get-movement-input.dto'
import { GetMovementUseCase } from '../use-cases/get-movement-usecase.service'
import { MovementPrimitiveProps } from '../../domain/movement-types'

@Injectable()
export class GetMovementHandler {
  constructor(private readonly useCase: GetMovementUseCase) {}

  async handle(input: GetMovementInput): Promise<MovementPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
