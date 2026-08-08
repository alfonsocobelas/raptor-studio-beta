import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { VisitaId } from '../../../../../shared/domain/value-objects/visitas/visita-id.vo'
import { VisitaRepository } from '../../domain/visita-repository'
import { VisitaPrimitiveProps } from '../../domain/visita-types'
import { GetVisitaInput } from '../dtos/get-visita-input.dto'

@Injectable()
export class GetVisitaUseCase {
  constructor(private readonly visitaRepository: VisitaRepository) {}

  async invoke(input: GetVisitaInput): Promise<VisitaPrimitiveProps> {
    const visitaId = VisitaId.create(input.id)
    const visita = await this.visitaRepository.get(visitaId)

    if (!visita) {
      throw new EntityNotFoundError('Visita', input.id)
    }

    return visita.toPrimitives()
  }
}
