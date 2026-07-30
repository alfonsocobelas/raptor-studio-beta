import { Injectable } from '@nestjs/common'
import { ResetPasswordInput } from '../dtos/reset-password-input.dto'
import { ResetPasswordUseCase } from '../use-cases/reset-password-usecase.service'

@Injectable()
export class ResetPasswordHandler {
  constructor(private readonly useCase: ResetPasswordUseCase) {}

  handle(input: ResetPasswordInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
