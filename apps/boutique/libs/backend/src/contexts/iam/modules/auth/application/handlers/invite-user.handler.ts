import { Injectable } from '@nestjs/common'
import { InviteUserInput } from '../dtos/invite-user-input.dto'
import { InviteUserUseCase } from '../use-cases/invite-user-usecase.service'

@Injectable()
export class InviteUserHandler {
  constructor(private readonly useCase: InviteUserUseCase) {}

  handle(input: InviteUserInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
