import { Injectable } from '@nestjs/common'
import { LogoutUseCase } from '../use-cases/logout-usecase.service'
import { LogoutInput } from '../dtos/logout-input.dto'

@Injectable()
export class LogoutHandler {
  constructor(private readonly useCase: LogoutUseCase) {}

  handle(input: LogoutInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
