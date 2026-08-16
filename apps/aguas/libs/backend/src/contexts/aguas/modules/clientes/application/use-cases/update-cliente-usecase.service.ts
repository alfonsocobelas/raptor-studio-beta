import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ClienteRepository } from '../../domain/cliente-repository'
import { ClienteId } from '../../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { UpdateClienteInput } from '../dtos/update-cliente-input.dto'

@Injectable()
export class UpdateClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async invoke(input: UpdateClienteInput): Promise<void> {
    const clienteId = ClienteId.create(input.id)
    const cliente = await this.clienteRepository.get(clienteId)

    if (!cliente) {
      throw new EntityNotFoundError('Cliente', input.id)
    }

    cliente.updateDetails(input.updates)
    await this.clienteRepository.save(cliente)
  }
}
