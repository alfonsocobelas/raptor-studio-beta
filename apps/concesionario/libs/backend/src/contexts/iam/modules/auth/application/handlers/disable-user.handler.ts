import { Injectable } from '@nestjs/common'
import { DisableUserInput } from '../dtos/disable-user-input.dto'
import { DisableUserUseCase } from '../use-cases/disable-user-usecase.service'

@Injectable()
export class DisableUserHandler {
  constructor(private readonly useCase: DisableUserUseCase) {}

  handle(input: DisableUserInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
