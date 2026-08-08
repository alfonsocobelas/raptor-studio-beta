import { Injectable } from '@nestjs/common'
import { GetPropiedadInput } from '../dtos/get-propiedad-input.dto'
import { GetPropiedadUseCase } from '../use-cases/get-propiedad-usecase.service'
import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'

@Injectable()
export class GetPropiedadHandler {
  constructor(private readonly useCase: GetPropiedadUseCase) {}

  async handle(input: GetPropiedadInput): Promise<PropiedadPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
