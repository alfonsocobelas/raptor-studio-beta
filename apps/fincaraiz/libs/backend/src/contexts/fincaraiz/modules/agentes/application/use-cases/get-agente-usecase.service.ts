import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { AgenteId } from '../../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { AgenteRepository } from '../../domain/agente-repository'
import { AgentePrimitiveProps } from '../../domain/agente-types'
import { GetAgenteInput } from '../dtos/get-agente-input.dto'

@Injectable()
export class GetAgenteUseCase {
  constructor(private readonly agenteRepository: AgenteRepository) {}

  async invoke(input: GetAgenteInput): Promise<AgentePrimitiveProps> {
    const agenteId = AgenteId.create(input.id)
    const agente = await this.agenteRepository.get(agenteId)

    if (!agente) {
      throw new EntityNotFoundError('Agente', input.id)
    }

    return agente.toPrimitives()
  }
}
