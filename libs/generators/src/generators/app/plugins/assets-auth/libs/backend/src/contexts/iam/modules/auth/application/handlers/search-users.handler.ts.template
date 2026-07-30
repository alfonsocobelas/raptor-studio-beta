import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { UserPrimitiveProps } from '../../domain/auth-types'
import { SearchUsersUseCase } from '../use-cases/search-users-usecase.service'

@Injectable()
export class SearchUsersHandler {
  constructor(private readonly useCase: SearchUsersUseCase) {}

  handle(input: OffsetInput): Promise<OffsetPaginatedOutput<UserPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
