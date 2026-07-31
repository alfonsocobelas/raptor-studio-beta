import { Injectable } from '@nestjs/common'
import { ForgotPasswordInput } from '../dtos/forgot-password-input.dto'
import { RequestPasswordResetUseCase } from '../use-cases/request-password-reset-usecase.service'

@Injectable()
export class ForgotPasswordHandler {
  constructor(private readonly useCase: RequestPasswordResetUseCase) {}

  handle(input: ForgotPasswordInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
