import { Injectable } from '@nestjs/common'
import { Parametro } from '../../domain/parametro'
import { ParametroRepository } from '../../domain/parametro-repository'
import { RegisterParametroInput } from '../dtos/register-parametro-input.dto'

@Injectable()
export class RegisterParametroUseCase {
  constructor(private readonly parametroRepository: ParametroRepository) {}

  async invoke(input: RegisterParametroInput): Promise<void> {
    const parametro = Parametro.register(input)
    await this.parametroRepository.register(parametro)
  }
}
