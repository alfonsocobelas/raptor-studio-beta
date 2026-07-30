import { Injectable } from '@nestjs/common'
import { ReactivateUserInput } from '../dtos/reactivate-user-input.dto'
import { ReactivateUserUseCase } from '../use-cases/reactivate-user-usecase.service'

@Injectable()
export class ReactivateUserHandler {
  constructor(private readonly useCase: ReactivateUserUseCase) {}

  handle(input: ReactivateUserInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
