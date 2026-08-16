import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ClientePrimitiveProps } from '../../domain/cliente-types'
import { SearchDeletedClientesUseCase } from '../use-cases/search-deleted-clientes-usecase.service'

@Injectable()
export class SearchDeletedClientesHandler {
  constructor(private readonly useCase: SearchDeletedClientesUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ClientePrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
