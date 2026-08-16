import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ClienteId } from '../../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { ClienteRepository } from '../../domain/cliente-repository'
import { ClientePrimitiveProps } from '../../domain/cliente-types'
import { GetClienteInput } from '../dtos/get-cliente-input.dto'

@Injectable()
export class GetClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async invoke(input: GetClienteInput): Promise<ClientePrimitiveProps> {
    const clienteId = ClienteId.create(input.id)
    const cliente = await this.clienteRepository.get(clienteId)

    if (!cliente) {
      throw new EntityNotFoundError('Cliente', input.id)
    }

    return cliente.toPrimitives()
  }
}
