import { Injectable } from '@nestjs/common'
import { Muestra } from '../../domain/muestra'
import { MuestraRepository } from '../../domain/muestra-repository'
import { RegisterMuestraInput } from '../dtos/register-muestra-input.dto'

@Injectable()
export class RegisterMuestraUseCase {
  constructor(private readonly muestraRepository: MuestraRepository) {}

  async invoke(input: RegisterMuestraInput): Promise<void> {
    const muestra = Muestra.register(input)
    await this.muestraRepository.register(muestra)
  }
}
