import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { UserPrimitiveProps } from '../../domain/auth-types'
import { UserRepository } from '../../domain/user-repository'
import searchUsersConfig from '../config/search-users-config'

@Injectable()
export class SearchUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<UserPrimitiveProps>> {
    const { allowedFilters, allowedOrders } = searchUsersConfig
    const criteria = Criteria.fromOffset(input, allowedFilters as string[], allowedOrders as string[])

    const [users, total] = await Promise.all([
      this.userRepository.matching(criteria),
      this.userRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: users.map(user => user.toPrimitives())
    }
  }
}
