import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { VisitaId } from '../../../../../shared/domain/value-objects/visitas/visita-id.vo'
import { VisitaRepository } from '../../domain/visita-repository'
import { RemoveVisitaInput } from '../dtos/remove-visita-input.dto'

@Injectable()
export class RemoveVisitaUseCase {
  constructor(private readonly visitaRepository: VisitaRepository) {}

  async invoke(input: RemoveVisitaInput): Promise<void> {
    const visitaId = VisitaId.create(input.id)
    const visita = await this.visitaRepository.get(visitaId)

    if (!visita) {
      throw new EntityNotFoundError('Visita', input.id)
    }

    await this.visitaRepository.remove(visitaId)
  }
}
