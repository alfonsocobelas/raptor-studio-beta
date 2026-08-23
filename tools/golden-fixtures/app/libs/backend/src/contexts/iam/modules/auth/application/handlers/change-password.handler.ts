import { Injectable } from '@nestjs/common'
import { ChangePasswordInput } from '../dtos/change-password-input.dto'
import { ChangePasswordResult, ChangePasswordUseCase } from '../use-cases/change-password-usecase.service'

@Injectable()
export class ChangePasswordHandler {
  constructor(private readonly useCase: ChangePasswordUseCase) {}

  handle(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    return this.useCase.invoke(input)
  }
}
