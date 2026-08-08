import { Injectable } from '@nestjs/common'
import { UpdatePropiedadInput } from '../dtos/update-propiedad-input.dto'
import { UpdatePropiedadUseCase } from '../use-cases/update-propiedad-usecase.service'

@Injectable()
export class UpdatePropiedadHandler {
  constructor(private readonly useCase: UpdatePropiedadUseCase) {}

  async handle(input: UpdatePropiedadInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
