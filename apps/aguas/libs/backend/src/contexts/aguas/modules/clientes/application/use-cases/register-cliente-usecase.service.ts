import { Injectable } from '@nestjs/common'
import { Cliente } from '../../domain/cliente'
import { ClienteRepository } from '../../domain/cliente-repository'
import { RegisterClienteInput } from '../dtos/register-cliente-input.dto'

@Injectable()
export class RegisterClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async invoke(input: RegisterClienteInput): Promise<void> {
    const cliente = Cliente.register(input)
    await this.clienteRepository.register(cliente)
  }
}
