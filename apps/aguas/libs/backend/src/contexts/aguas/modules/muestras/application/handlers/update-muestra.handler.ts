import { Injectable } from '@nestjs/common'
import { UpdateMuestraInput } from '../dtos/update-muestra-input.dto'
import { UpdateMuestraUseCase } from '../use-cases/update-muestra-usecase.service'

@Injectable()
export class UpdateMuestraHandler {
  constructor(private readonly useCase: UpdateMuestraUseCase) {}

  async handle(input: UpdateMuestraInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
