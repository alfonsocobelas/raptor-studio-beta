import { Injectable } from '@nestjs/common'
import { RemovePropiedadInput } from '../dtos/remove-propiedad-input.dto'
import { RemovePropiedadUseCase } from '../use-cases/remove-propiedad-usecase.service'

@Injectable()
export class RemovePropiedadHandler {
  constructor(private readonly useCase: RemovePropiedadUseCase) {}

  async handle(input: RemovePropiedadInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
