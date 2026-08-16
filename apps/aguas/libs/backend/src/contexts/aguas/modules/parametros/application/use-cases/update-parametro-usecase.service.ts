import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ParametroRepository } from '../../domain/parametro-repository'
import { ParametroId } from '../../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import { UpdateParametroInput } from '../dtos/update-parametro-input.dto'

@Injectable()
export class UpdateParametroUseCase {
  constructor(private readonly parametroRepository: ParametroRepository) {}

  async invoke(input: UpdateParametroInput): Promise<void> {
    const parametroId = ParametroId.create(input.id)
    const parametro = await this.parametroRepository.get(parametroId)

    if (!parametro) {
      throw new EntityNotFoundError('Parametro', input.id)
    }

    parametro.updateDetails(input.updates)
    await this.parametroRepository.save(parametro)
  }
}
