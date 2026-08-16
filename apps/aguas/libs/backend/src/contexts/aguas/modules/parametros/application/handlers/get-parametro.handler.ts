import { Injectable } from '@nestjs/common'
import { GetParametroInput } from '../dtos/get-parametro-input.dto'
import { GetParametroUseCase } from '../use-cases/get-parametro-usecase.service'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'

@Injectable()
export class GetParametroHandler {
  constructor(private readonly useCase: GetParametroUseCase) {}

  async handle(input: GetParametroInput): Promise<ParametroPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
