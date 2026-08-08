import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { PropiedadRepository } from '../../domain/propiedad-repository'
import { PropiedadId } from '../../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { UpdatePropiedadInput } from '../dtos/update-propiedad-input.dto'

@Injectable()
export class UpdatePropiedadUseCase {
  constructor(private readonly propiedadRepository: PropiedadRepository) {}

  async invoke(input: UpdatePropiedadInput): Promise<void> {
    const propiedadId = PropiedadId.create(input.id)
    const propiedad = await this.propiedadRepository.get(propiedadId)

    if (!propiedad) {
      throw new EntityNotFoundError('Propiedad', input.id)
    }

    propiedad.updateDetails(input.updates)
    await this.propiedadRepository.save(propiedad)
  }
}
