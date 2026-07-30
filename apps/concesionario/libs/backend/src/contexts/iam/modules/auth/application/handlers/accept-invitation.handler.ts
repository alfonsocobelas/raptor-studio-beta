import { Injectable } from '@nestjs/common'
import { AcceptInvitationInput } from '../dtos/accept-invitation-input.dto'
import { AcceptInvitationUseCase } from '../use-cases/accept-invitation-usecase.service'

@Injectable()
export class AcceptInvitationHandler {
  constructor(private readonly useCase: AcceptInvitationUseCase) {}

  handle(input: AcceptInvitationInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
