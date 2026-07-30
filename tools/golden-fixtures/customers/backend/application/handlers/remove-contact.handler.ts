import { Injectable } from '@nestjs/common'
import { RemoveContactInput } from '../dtos/remove-contact-input.dto'
import { RemoveContactUseCase } from '../use-cases/remove-contact-usecase.service'

@Injectable()
export class RemoveContactHandler {
  constructor(private readonly useCase: RemoveContactUseCase) {}

  async handle(input: RemoveContactInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
