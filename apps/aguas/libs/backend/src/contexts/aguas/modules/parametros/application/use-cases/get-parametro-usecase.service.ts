import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ParametroId } from '../../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import { ParametroRepository } from '../../domain/parametro-repository'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'
import { GetParametroInput } from '../dtos/get-parametro-input.dto'

@Injectable()
export class GetParametroUseCase {
  constructor(private readonly parametroRepository: ParametroRepository) {}

  async invoke(input: GetParametroInput): Promise<ParametroPrimitiveProps> {
    const parametroId = ParametroId.create(input.id)
    const parametro = await this.parametroRepository.get(parametroId)

    if (!parametro) {
      throw new EntityNotFoundError('Parametro', input.id)
    }

    return parametro.toPrimitives()
  }
}
