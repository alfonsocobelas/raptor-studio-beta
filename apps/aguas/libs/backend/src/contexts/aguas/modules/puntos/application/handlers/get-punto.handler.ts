import { Injectable } from '@nestjs/common'
import { GetPuntoInput } from '../dtos/get-punto-input.dto'
import { GetPuntoUseCase } from '../use-cases/get-punto-usecase.service'
import { PuntoPrimitiveProps } from '../../domain/punto-types'

@Injectable()
export class GetPuntoHandler {
  constructor(private readonly useCase: GetPuntoUseCase) {}

  async handle(input: GetPuntoInput): Promise<PuntoPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
