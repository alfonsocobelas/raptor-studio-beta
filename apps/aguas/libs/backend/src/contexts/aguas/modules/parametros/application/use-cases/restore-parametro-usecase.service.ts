import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ParametroId } from '../../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import { ParametroRepository } from '../../domain/parametro-repository'
import { RestoreParametroInput } from '../dtos/restore-parametro-input.dto'

@Injectable()
export class RestoreParametroUseCase {
  constructor(private readonly parametroRepository: ParametroRepository) {}

  async invoke(input: RestoreParametroInput): Promise<void> {
    const restored = await this.parametroRepository.restore(ParametroId.create(input.id))

    if (!restored) {
      throw new EntityNotFoundError('Parametro', input.id)
    }
  }
}
