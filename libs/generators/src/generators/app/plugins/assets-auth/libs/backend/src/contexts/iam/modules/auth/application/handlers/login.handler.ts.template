import { Injectable } from '@nestjs/common'
import { LoginInput } from '../dtos/login-input.dto'
import { LoginResult, LoginUseCase } from '../use-cases/login-usecase.service'

@Injectable()
export class LoginHandler {
  constructor(private readonly useCase: LoginUseCase) {}

  handle(input: LoginInput): Promise<LoginResult> {
    return this.useCase.invoke(input)
  }
}
