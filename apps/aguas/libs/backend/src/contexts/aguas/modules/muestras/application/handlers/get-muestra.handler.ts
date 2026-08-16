import { Injectable } from '@nestjs/common'
import { GetMuestraInput } from '../dtos/get-muestra-input.dto'
import { GetMuestraUseCase } from '../use-cases/get-muestra-usecase.service'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'

@Injectable()
export class GetMuestraHandler {
  constructor(private readonly useCase: GetMuestraUseCase) {}

  async handle(input: GetMuestraInput): Promise<MuestraPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
