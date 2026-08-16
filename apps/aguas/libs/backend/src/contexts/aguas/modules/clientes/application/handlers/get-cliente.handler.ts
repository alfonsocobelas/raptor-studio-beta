import { Injectable } from '@nestjs/common'
import { GetClienteInput } from '../dtos/get-cliente-input.dto'
import { GetClienteUseCase } from '../use-cases/get-cliente-usecase.service'
import { ClientePrimitiveProps } from '../../domain/cliente-types'

@Injectable()
export class GetClienteHandler {
  constructor(private readonly useCase: GetClienteUseCase) {}

  async handle(input: GetClienteInput): Promise<ClientePrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
