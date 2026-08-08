import { Injectable } from '@nestjs/common'
import { Agente } from '../../domain/agente'
import { AgenteRepository } from '../../domain/agente-repository'
import { RegisterAgenteInput } from '../dtos/register-agente-input.dto'

@Injectable()
export class RegisterAgenteUseCase {
  constructor(private readonly agenteRepository: AgenteRepository) {}

  async invoke(input: RegisterAgenteInput): Promise<void> {
    const agente = Agente.register(input)
    await this.agenteRepository.register(agente)
  }
}
