import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { PropiedadId } from '../../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { PropiedadRepository } from '../../domain/propiedad-repository'
import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'
import { GetPropiedadInput } from '../dtos/get-propiedad-input.dto'

@Injectable()
export class GetPropiedadUseCase {
  constructor(private readonly propiedadRepository: PropiedadRepository) {}

  async invoke(input: GetPropiedadInput): Promise<PropiedadPrimitiveProps> {
    const propiedadId = PropiedadId.create(input.id)
    const propiedad = await this.propiedadRepository.get(propiedadId)

    if (!propiedad) {
      throw new EntityNotFoundError('Propiedad', input.id)
    }

    return propiedad.toPrimitives()
  }
}
