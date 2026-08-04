import { Injectable } from '@nestjs/common'
import { AddContactInput } from '../dtos/add-contact-input.dto'
import { AddContactUseCase } from '../use-cases/add-contact-usecase.service'

@Injectable()
export class AddContactHandler {
  constructor(private readonly useCase: AddContactUseCase) {}

  async handle(input: AddContactInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
