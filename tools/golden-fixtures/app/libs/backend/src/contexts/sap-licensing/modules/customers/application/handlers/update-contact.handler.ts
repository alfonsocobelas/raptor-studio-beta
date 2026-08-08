import { Injectable } from '@nestjs/common'
import { UpdateContactInput } from '../dtos/update-contact-input.dto'
import { UpdateContactUseCase } from '../use-cases/update-contact-usecase.service'

@Injectable()
export class UpdateContactHandler {
  constructor(private readonly useCase: UpdateContactUseCase) {}

  async handle(input: UpdateContactInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
