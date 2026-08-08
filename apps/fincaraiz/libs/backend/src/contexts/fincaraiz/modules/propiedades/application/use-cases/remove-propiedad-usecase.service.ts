import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { PropiedadId } from '../../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { PropiedadRepository } from '../../domain/propiedad-repository'
import { RemovePropiedadInput } from '../dtos/remove-propiedad-input.dto'

@Injectable()
export class RemovePropiedadUseCase {
  constructor(private readonly propiedadRepository: PropiedadRepository) {}

  async invoke(input: RemovePropiedadInput): Promise<void> {
    const propiedadId = PropiedadId.create(input.id)
    const propiedad = await this.propiedadRepository.get(propiedadId)

    if (!propiedad) {
      throw new EntityNotFoundError('Propiedad', input.id)
    }

    await this.propiedadRepository.remove(propiedadId)
  }
}
