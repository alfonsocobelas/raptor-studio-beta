import { Injectable } from '@nestjs/common'
import { ChangeUserRoleInput } from '../dtos/change-user-role-input.dto'
import { ChangeUserRoleUseCase } from '../use-cases/change-user-role-usecase.service'

@Injectable()
export class ChangeUserRoleHandler {
  constructor(private readonly useCase: ChangeUserRoleUseCase) {}

  handle(input: ChangeUserRoleInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
