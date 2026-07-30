import { Injectable } from '@nestjs/common'
import { GetClientInput } from '../dtos/get-client-input.dto'
import { GetClientUseCase } from '../use-cases/get-client-usecase.service'
import { ClientPrimitiveProps } from '../../domain/client-types'

@Injectable()
export class GetClientHandler {
  constructor(private readonly useCase: GetClientUseCase) {}

  async handle(input: GetClientInput): Promise<ClientPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
